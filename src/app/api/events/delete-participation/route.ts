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

    // Get all team members for this event
    const teamMembers = await prisma.eventParticipant.findMany({
      where: {
        eventId: Number(eventId),
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
      return NextResponse.json(
        { error: "No participants found" },
        { status: 404 }
      );
    }

    // Get the team lead
    const teamLead = teamMembers.find(member => member.mainParticipantId === null);
    if (!teamLead) {
      return NextResponse.json(
        { error: "Team leader not found" },
        { status: 404 }
      );
    }

    // Check if the requesting user is the team leader
    if (teamLead.user.id !== Number(decoded.userId)) {
      return NextResponse.json(
        { error: "Only team leaders can cancel team participation" },
        { status: 403 }
      );
    }

    // Send notifications to all team members first (to ensure they get the notification before deletion)
    const notificationPromises = teamMembers.map(async (member) => {
      if (member.user.fcmToken) {
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
    await prisma.eventParticipant.deleteMany({
      where: {
        OR: [
          // Delete the team leader's record
          { id: teamLead.id },
          // Delete all team members' records
          { mainParticipantId: teamLead.id }
        ]
      },
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