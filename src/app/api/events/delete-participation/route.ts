import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendNotification } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { eventId } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First verify the user from token
    const decoded = await verifyAccessToken(token);
    if (!decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // First, find the user's own participation
    const userParticipation = await prisma.eventParticipant.findFirst({
      where: {
        eventId: Number(eventId),
        userId: Number(decoded.userId),
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

    if (!userParticipation) {
      return NextResponse.json(
        { error: "You are not registered for this event" },
        { status: 404 }
      );
    }

    // Check if user is part of a team
    const isPartOfTeam = userParticipation.mainParticipantId !== null;
    const isTeamLeader = userParticipation.teamLeader;
    
    // If user is part of a team but not the leader, they can't delete
    if (isPartOfTeam && !isTeamLeader) {
      return NextResponse.json(
        { error: "Only team leaders can cancel team participation" },
        { status: 403 }
      );
    }

    // Get all team members if this is a team leader
    let teamMemberIds = [];
    let teamMembers = [];

    if (userParticipation.mainParticipantId === null) {
      // This is a main team leader - get all team members
      teamMembers = await prisma.eventParticipant.findMany({
        where: {
          eventId: Number(eventId),
          OR: [
            // All members who have this user as their mainParticipant
            { mainParticipantId: userParticipation.id },
            // Include the leader themselves
            { id: userParticipation.id }
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

      teamMemberIds = teamMembers.map(member => member.id);
    } else {
      // This is a team leader who is part of another team (unusual case)
      // Just include their own record
      teamMembers = [userParticipation];
      teamMemberIds = [userParticipation.id];
    }

    if (!teamMembers || teamMembers.length === 0) {
      // Fallback in case no team members found
      teamMembers = [userParticipation];
      teamMemberIds = [userParticipation.id];
    }

    // Check if attendance has been marked for any team member
    const attendanceCheck = await prisma.eventAttendance.findFirst({
      where: {
        eventId: Number(eventId),
        userId: {
          in: teamMembers.map(member => member.user.id)
        }
      }
    });

    // Also check if isAttended flag is true for any team member
    const attendedParticipant = teamMembers.find(member => member.isAttended);

    if (attendanceCheck || attendedParticipant) {
      return NextResponse.json(
        { error: "Cannot cancel participation after attendance has been marked" },
        { status: 403 }
      );
    }

    // The team lead is the requesting user
    const teamLead = userParticipation;

    // Send notifications to all team members first (to ensure they get the notification before deletion)
    const notificationPromises = teamMembers.map(async (member) => {
      if (member.user.fcmToken && member.user.id !== teamLead.user.id) {
        try {
          await sendNotification(
            member.user.fcmToken,
            "Team Participation Cancelled",
            `${teamLead.user.name}'s team participation in ${member.event.name} has been cancelled`,
            {
              type: "TEAM_PARTICIPATION_CANCELLED",
              eventId: eventId.toString(),
              teamLeadName: teamLead.user.name,
              eventName: member.event.name
            }
          );

          // Create a notification record in the database
          await prisma.notification.create({
            data: {
              userId: member.user.id,
              title: "Team Participation Cancelled",
              message: `${teamLead.user.name}'s team participation in ${member.event.name} has been cancelled`,
              type: "GENERAL",
              metadata: {
                type: "TEAM_PARTICIPATION_CANCELLED",
                eventId: eventId.toString(),
                teamLeadName: teamLead.user.name,
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

    // Delete related records in ClueScans and TreasureHunt for all team members
    await prisma.clueScans.deleteMany({
      where: {
        eventParticipationId: {
          in: teamMemberIds,
        },
      },
    });

    await prisma.treasureHunt.deleteMany({
      where: {
        eventParticipationId: {
          in: teamMemberIds,
        },
      },
    });

    // Now delete all team participations in a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // First clear mainParticipantId references to avoid foreign key constraints
      if (userParticipation.mainParticipantId === null) {
        // Update all team members to no longer reference the leader
        await tx.eventParticipant.updateMany({
          where: {
            mainParticipantId: userParticipation.id,
          },
          data: {
            mainParticipantId: null,
          },
        });
      }

      // Now delete all team members including the leader
      await tx.eventParticipant.deleteMany({
        where: {
          id: {
            in: teamMemberIds,
          },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}