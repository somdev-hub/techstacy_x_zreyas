import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendNotification } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { notificationId, accept } = data;

    const headersList = await headers();
    const protocol = req.nextUrl.protocol;
    const host = headersList.get("host") || req.nextUrl.host;
    const baseUrl = `${protocol}//${host}`;

    // Get user from /api/user/me
    const userResponse = await fetch(`${baseUrl}/api/user/me`, {
      headers: {
        Cookie: headersList.get("cookie") || "",
        Host: host,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userResponse.json();

    // Get the notification and verify it belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: Number(notificationId),
        userId: user.id,
        type: "TEAM_INVITE",
      },
      include: {
        user: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Parse the metadata to get event participant info
    const metadata = notification.metadata as {
      participantId: number;
      mainParticipantId: number;
      mainParticipantName: string;
      eventId: number;
    };

    if (accept) {
      // Update the event participation status
      await prisma.eventParticipant.update({
        where: {
          id: metadata.participantId,
        },
        data: {
          isConfirmed: true,
        },
      });

      // Get the team lead's user record to get their FCM token
      const teamLead = await prisma.eventParticipant.findUnique({
        where: {
          id: metadata.mainParticipantId,
        },
        include: {
          user: true,
          event: true,
        },
      });

      if (teamLead?.user.fcmToken) {
        // Send notification to team lead
        await sendNotification(
          teamLead.user.fcmToken,
          "Team Invite Accepted",
          `${user.name} has accepted your invite to join ${teamLead.event.name}`,
          {
            type: "TEAM_INVITE_RESPONSE",
            eventId: metadata.eventId.toString(),
            response: "accepted",
          }
        );
      }
    } else {
      // If rejected, delete the participation record
      await prisma.eventParticipant.delete({
        where: {
          id: metadata.participantId,
        },
      });

      // Get the team lead's user record to get their FCM token
      const teamLead = await prisma.eventParticipant.findUnique({
        where: {
          id: metadata.mainParticipantId,
        },
        include: {
          user: true,
          event: true,
        },
      });

      if (teamLead?.user.fcmToken) {
        // Send notification to team lead
        await sendNotification(
          teamLead.user.fcmToken,
          "Team Invite Declined",
          `${user.name} has declined your invite to join ${teamLead.event.name}`,
          {
            type: "TEAM_INVITE_RESPONSE",
            eventId: metadata.eventId.toString(),
            response: "declined",
          }
        );
      }
    }

    // Mark notification as read
    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      message: accept ? "Team invite accepted" : "Team invite rejected",
    });
  } catch (error) {
    console.error("Error handling team invite response:", error);
    return NextResponse.json(
      { error: "Failed to process team invite response" },
      { status: 500 }
    );
  }
}
