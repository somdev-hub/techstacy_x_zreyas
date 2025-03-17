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

    // Determine if this user is a team leader or a team member
    // A team leader either has mainParticipantId === null or is marked as teamLeader === true
    const isTeamLeader = !userParticipation.mainParticipantId || userParticipation.teamLeader;
    
    if (!isTeamLeader) {
      return NextResponse.json(
        { error: "Only team leaders can cancel team participation" },
        { status: 403 }
      );
    }

    // Get all team members (either led by this user or where this user is a member)
    let teamMembers = await prisma.eventParticipant.findMany({
      where: {
        eventId: Number(eventId),
        OR: [
          // If this is a team leader with members
          { 
            mainParticipantId: userParticipation.id 
          },
          // Include the leader themselves
          { 
            id: userParticipation.id 
          }
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
      // If somehow no team members are found, still allow deletion of the user's own participation
      teamMembers = [userParticipation];
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

    // Delete related records in ClueScans and TreasureHunt
    await prisma.clueScans.deleteMany({
      where: {
        eventParticipationId: {
          in: teamMembers.map(member => member.id),
        },
      },
    });

    await prisma.treasureHunt.deleteMany({
      where: {
        eventParticipationId: {
          in: teamMembers.map(member => member.id),
        },
      },
    });

    // Now delete team participations
    if (isTeamLeader && userParticipation.mainParticipantId === null) {
      // If this is a main team leader (not a member of another team)
      await prisma.eventParticipant.deleteMany({
        where: {
          OR: [
            // Delete the team leader's record
            { id: userParticipation.id },
            // Delete all team members' records
            { mainParticipantId: userParticipation.id }
          ]
        },
      });
    } else {
      // If this is somehow a team leader who is also a member of another team
      // or another special case, just delete their own record
      await prisma.eventParticipant.delete({
        where: {
          id: userParticipation.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}