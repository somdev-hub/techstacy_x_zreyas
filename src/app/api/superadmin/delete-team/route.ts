import { NextRequest, NextResponse } from "next/server";
import { NotificationType, PrismaClient, Role } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { sendNotification } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { eventId, teamLeaderId } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!eventId || !teamLeaderId) {
      return NextResponse.json(
        { error: "Missing required fields: eventId and teamLeaderId are required" },
        { status: 400 }
      );
    }

    // First verify the user is a superadmin
    const decoded = await verifyAccessToken(token);
    if (!decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if the user is a superadmin
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.userId) },
      select: { role: true, name: true }
    });

    if (!user || user.role !== Role.SUPERADMIN) {
      return NextResponse.json(
        { error: "Unauthorized. Only superadmins can use this endpoint" },
        { status: 403 }
      );
    }

    // Find the team leader's participation record based on userId and eventId
    const teamLeaderParticipation = await prisma.eventParticipant.findFirst({
      where: {
        eventId: Number(eventId),
        userId: Number(teamLeaderId),
        teamLeader: true,
        mainParticipantId: null, // This ensures we're getting the main team leader
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            fcmToken: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!teamLeaderParticipation) {
      return NextResponse.json(
        { error: "Team leader participation not found for this event" },
        { status: 404 }
      );
    }

    // Get all team members of this team
    let teamMembers = await prisma.eventParticipant.findMany({
      where: {
        eventId: Number(eventId),
        OR: [
          // All members who have this user as their mainParticipant
          { mainParticipantId: teamLeaderParticipation.id },
          // Include the leader themselves
          { id: teamLeaderParticipation.id }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            fcmToken: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!teamMembers || teamMembers.length === 0) {
      // If no team members found, but we have the leader, use just the leader
      teamMembers = [teamLeaderParticipation];
    }

    const teamMemberIds = teamMembers.map(member => member.id);

    // Send notifications to all team members about the admin action
    const notificationPromises = teamMembers.map(async (member) => {
      if (member.user.fcmToken) {
        try {
          // Send push notification
          await sendNotification(
            member.user.fcmToken,
            "Team Participation Cancelled by Admin",
            `Your team participation in ${member.event.name} has been cancelled by an administrator`,
            {
              type: "TEAM_PARTICIPATION_CANCELLED",
              eventId: eventId.toString(),
              adminAction: 'true',
              adminName: user.name,
              eventName: member.event.name
            }
          );

          // Create a notification record in the database
          await prisma.notification.create({
            data: {
              userId: member.user.id,
              title: "Team Participation Cancelled by Admin",
              message: `Your team participation in ${member.event.name} has been cancelled by an administrator`,
              type: NotificationType.EVENT_CANCELLED,
              metadata: {
                type: "TEAM_PARTICIPATION_CANCELLED",
                eventId: eventId.toString(),
                adminAction: true,
                adminName: user.name,
                eventName: member.event.name
              }
            }
          });
        } catch (error) {
          console.error(`Failed to send notification to user ${member.user.id}:`, error);
        }
      }
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    // Delete related records in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Delete related records in ClueScans
      await tx.clueScans.deleteMany({
        where: {
          eventParticipationId: {
            in: teamMemberIds,
          },
        },
      });

      // Delete related records in TreasureHunt
      await tx.treasureHunt.deleteMany({
        where: {
          eventParticipationId: {
            in: teamMemberIds,
          },
        },
      });

      // First clear mainParticipantId references to avoid foreign key constraints
      await tx.eventParticipant.updateMany({
        where: {
          mainParticipantId: teamLeaderParticipation.id,
        },
        data: {
          mainParticipantId: null,
        },
      });

      // Now delete all team members including the leader
      await tx.eventParticipant.deleteMany({
        where: {
          id: {
            in: teamMemberIds,
          },
        },
      });

      // Decrement event participation count for all team members
      for (const member of teamMembers) {
        await tx.user.update({
          where: { id: member.user.id },
          data: {
            eventParticipation: {
              decrement: 1,
            },
          },
        });
      }
    });

    return NextResponse.json({ 
      success: true,
      message: `Team "${teamLeaderParticipation.user.name}'s team" for event "${teamLeaderParticipation.event.name}" has been deleted successfully`,
      teamMembersCount: teamMembers.length
    });
  } catch (error) {
    console.error("Error in superadmin delete team:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}