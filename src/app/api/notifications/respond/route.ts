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

    if (typeof notificationId !== "number" || typeof accept !== "boolean") {
      return NextResponse.json(
        {
          error:
            "Invalid parameters. notificationId must be a number and accept must be a boolean",
        },
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
        isRead: false, // Only allow responding to unread notifications
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

    if (
      !metadata ||
      !metadata.participantId ||
      !metadata.mainParticipantId ||
      !metadata.eventId
    ) {
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
            id: Number(metadata.participantId),
          },
          data: {
            isConfirmed: true,
          },
        });

        // Get the team lead's user record
        const teamLead = await prisma.eventParticipant.findUnique({
          where: {
            id: Number(metadata.mainParticipantId),
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
            },
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
        // First check the event's partialRegistration setting
        const event = await prisma.event.findUnique({
          where: {
            id: Number(metadata.eventId),
          },
          select: {
            id: true,
            name: true,
            partialRegistration: true,
          },
        });

        if (!event) {
          return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Get all team members including the team lead
        const teamMembers = await prisma.eventParticipant.findMany({
          where: {
            OR: [
              { id: Number(metadata.mainParticipantId) },
              { mainParticipantId: Number(metadata.mainParticipantId) },
            ],
          },
          include: {
            user: true,
          },
        });

        const mainParticipant = teamMembers.find(
          (member) => member.id === Number(metadata.mainParticipantId)
        );

        if (!event.partialRegistration) {
          // If partial registration is not allowed, delete all team members' registrations
          await prisma.$transaction([
            // Delete all team members' registrations
            prisma.eventParticipant.deleteMany({
              where: {
                OR: [
                  { id: Number(metadata.mainParticipantId) },
                  { mainParticipantId: Number(metadata.mainParticipantId) },
                ],
              },
            }),
            // Decrement event participation count for all team members
            ...teamMembers.map((member) =>
              prisma.user.update({
                where: { id: member.user.id },
                data: {
                  eventParticipation: {
                    decrement: 1,
                  },
                },
              })
            ),
          ]);

          // Notify all team members about the cancellation
          if (mainParticipant) {
            await Promise.all(
              teamMembers
                .filter((member) => member.id !== Number(metadata.participantId)) // Exclude the declining member
                .map((member) =>
                  NotificationService.createNotification({
                    userId: member.user.id,
                    title: "Team Registration Cancelled",
                    message: `Team registration for ${event.name} has been cancelled as ${user.name} declined the invite and partial registration is not allowed.`,
                    type: NotificationType.EVENT_CANCELLED,
                    metadata: {
                      eventId: event.id.toString(),
                      reason: "TEAM_MEMBER_DECLINED",
                    },
                  })
                )
            );
          }
        } else {
          // If partial registration is allowed, only delete the declining member's registration
          await prisma.$transaction([
            prisma.eventParticipant.delete({
              where: {
                id: Number(metadata.participantId),
              },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: {
                eventParticipation: {
                  decrement: 1,
                },
              },
            }),
          ]);
        }

        // Notify team lead about the decline
        if (mainParticipant) {
          await NotificationService.createNotification({
            userId: mainParticipant.user.id,
            title: "Team Invite Declined",
            message: `${user.name} has declined your invite to join ${event.name}${
              !event.partialRegistration
                ? ". As partial registration is not allowed, the entire team registration has been cancelled."
                : ""
            }`,
            type: NotificationType.INVITE_REJECTED,
            metadata: {
              type: "TEAM_INVITE_RESPONSE",
              eventId: event.id.toString(),
              response: "declined",
              teamCancelled: (!event.partialRegistration).toString(),
            },
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
    console.error(
      error instanceof Error
        ? error.message
        : "Error processing team invite response:",
      error
    );
    console.log(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to process team invite response" },
      { status: 500 }
    );
  }
}
