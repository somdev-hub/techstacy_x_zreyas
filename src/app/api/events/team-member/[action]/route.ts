import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendNotification } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  try {
    const { eventId, teamMemberId } = await req.json();
    const action = params.action;
    console.log("action", action, eventId, teamMemberId);

    if (!eventId || !teamMemberId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the event details first
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
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
            fcmToken: true,
          },
        },
      },
    });

    // Get the affected member's info
    const affectedMember = teamMembers.find(
      (member) => member.userId === Number(teamMemberId)
    );

    if (!affectedMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Delete the participation
    await prisma.eventParticipant.deleteMany({
      where: {
        userId: Number(teamMemberId),
        eventId: Number(eventId),
      },
    });

    // Send notifications to all team members
    for (const member of teamMembers) {
      if (member.user.fcmToken && member.user.id !== Number(teamMemberId)) {
        await sendNotification(
          member.user.fcmToken,
          "Team Update",
          `${affectedMember.user.name} has been removed from the team for ${event.name}`,
          {
            type: "TEAM_MEMBER_REMOVED_NOTIFICATION",
            eventId: eventId.toString(),
          }
        );
      }
    }

    // Send notification to removed member
    if (affectedMember.user.fcmToken) {
      await sendNotification(
        affectedMember.user.fcmToken,
        "Team Update",
        `You have been removed from the team for ${event.name}`,
        {
          type: "TEAM_MEMBER_REMOVED",
          eventId: eventId.toString(),
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in team member action:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
