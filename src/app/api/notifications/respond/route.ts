import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";
import { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Parse request data
    const data = await req.json();
    const { notificationId, accept } = data;

    if (typeof notificationId !== 'number' || typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid parameters. notificationId must be a number and accept must be a boolean" },
        { status: 400 }
      );
    }

    // Get user from request
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the notification and verify it belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
        type: NotificationType.TEAM_INVITE,
        isRead: false // Only allow responding to unread notifications
      },
      include: {
        user: true,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found or already processed" },
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

    if (!metadata || !metadata.participantId || !metadata.mainParticipantId || !metadata.eventId) {
      return NextResponse.json(
        { error: "Invalid notification metadata" },
        { status: 400 }
      );
    }

    if (accept) {
      try {
        // Update the event participation status
        await prisma.eventParticipant.update({
          where: {
            id: metadata.participantId,
          },
          data: {
            isConfirmed: true,
          },
        });

        // Get the team lead's user record
        const teamLead = await prisma.eventParticipant.findUnique({
          where: {
            id: metadata.mainParticipantId,
          },
          include: {
            user: true,
            event: true,
          },
        });

        if (teamLead) {
          // Create a notification for the team lead
          await NotificationService.createNotification({
            userId: teamLead.user.id,
            title: "Team Invite Accepted",
            message: `${user.name} has accepted your invite to join ${teamLead.event.name}`,
            type: NotificationType.GENERAL,
            metadata: {
              type: "TEAM_INVITE_RESPONSE",
              eventId: metadata.eventId.toString(),
              response: "accepted",
            }
          });
        }
      } catch (error) {
        console.error("Error processing team invite acceptance:", error);
        return NextResponse.json(
          { error: "Failed to accept team invite" },
          { status: 500 }
        );
      }
    } else {
      try {
        // If rejected, first check if the participation record exists
        const participation = await prisma.eventParticipant.findFirst({
          where: {
            id: metadata.participantId,
          },
        });

        if (participation) {
          // Delete the participation record only if it exists
          await prisma.eventParticipant.delete({
            where: {
              id: metadata.participantId,
            },
          });
        }

        // Get the team lead's user record
        const teamLead = await prisma.eventParticipant.findUnique({
          where: {
            id: metadata.mainParticipantId,
          },
          include: {
            user: true,
            event: true,
          },
        });

        if (teamLead) {
          // Create a notification for the team lead
          await NotificationService.createNotification({
            userId: teamLead.user.id,
            title: "Team Invite Declined",
            message: `${user.name} has declined your invite to join ${teamLead.event.name}`,
            type: NotificationType.GENERAL,
            metadata: {
              type: "TEAM_INVITE_RESPONSE",
              eventId: metadata.eventId.toString(),
              response: "declined",
            }
          });
        }
      } catch (error) {
        console.error("Error processing team invite rejection:", error);
        return NextResponse.json(
          { error: "Failed to reject team invite" },
          { status: 500 }
        );
      }
    }

    // Mark notification as read
    await NotificationService.markAsRead(notification.id, user.id);

    return NextResponse.json({
      success: true,
      message: accept ? "Team invite accepted" : "Team invite rejected",
    });
  } catch (error) {
    console.error("Error processing team invite response:", error);
    console.log(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to process team invite response" },
      { status: 500 }
    );
  }
}
