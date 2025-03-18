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

    // Get event information to check partialRegistration setting
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

    // Find other pending team invites for the same event (different teams)
    const otherPendingInvites = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: NotificationType.TEAM_INVITE,
        isRead: false,
        id: { not: notificationId },
        metadata: {
          path: "$.eventId",
          equals: metadata.eventId.toString(),
        },
      },
      include: {
        user: true,
      },
    });

    // Process the current invitation response
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
            type: NotificationType.INVITE_ACCEPTED,
            metadata: {
              type: "TEAM_INVITE_RESPONSE",
              eventId: metadata.eventId.toString(),
              response: "accepted",
            },
          });
        }

        // If the event doesn't allow partial registration, handle the competing team leaders
        if (!event.partialRegistration && otherPendingInvites.length > 0) {
          // For each competing team lead
          for (const pendingInvite of otherPendingInvites) {
            const inviteMetadata = pendingInvite.metadata as {
              participantId: number;
              mainParticipantId: number;
              mainParticipantName: string;
              eventId: number;
            };

            // Cancel the entire team including the team leader and all members
            await cancelEntireTeam(inviteMetadata.mainParticipantId, event.id, user);
          }
        } else {
          // If partial registration is allowed, just reject the other pending invites
          for (const pendingInvite of otherPendingInvites) {
            await handleRejectedInvite(pendingInvite, user);
          }
        }
      } catch (error) {
        console.error("Error processing team invite acceptance:", error);
        return NextResponse.json(
          { error: "Failed to accept team invite" },
          { status: 500 }
        );
      }
    } else {
      // If the user rejects this invite
      try {
        await handleRejectedInvite(notification, user);
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

    // Mark other pending invites for the same event as read
    if (otherPendingInvites.length > 0) {
      for (const pendingInvite of otherPendingInvites) {
        await NotificationService.markAsRead(pendingInvite.id, user.id);
      }
    }

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

/**
 * Helper function to handle the rejection of a team invitation
 */
async function handleRejectedInvite(notification: any, user: any) {
  const metadata = notification.metadata as {
    participantId: number;
    mainParticipantId: number;
    mainParticipantName: string;
    eventId: number;
  };

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
    throw new Error("Event not found");
  }

  // Delete just the individual participant record for this specific invitation
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

  // Notify team lead about the decline
  const teamLead = await prisma.eventParticipant.findUnique({
    where: {
      id: Number(metadata.mainParticipantId),
    },
    include: {
      user: true,
    },
  });

  if (teamLead) {
    await NotificationService.createNotification({
      userId: teamLead.user.id,
      title: "Team Invite Declined",
      message: `${user.name} has declined your invite to join ${event.name}`,
      type: NotificationType.INVITE_REJECTED,
      metadata: {
        type: "TEAM_INVITE_RESPONSE",
        eventId: event.id.toString(),
        response: "declined",
      },
    });
  }
}

/**
 * Helper function to cancel an entire team when a user accepts a competing team invite
 * in an event that doesn't allow partial registration
 */
async function cancelEntireTeam(mainParticipantId: number, eventId: number, userWhoAccepted: any) {
  // Get team lead information
  const teamLead = await prisma.eventParticipant.findUnique({
    where: {
      id: mainParticipantId,
    },
    include: {
      user: true,
      event: true,
    },
  });

  if (!teamLead) {
    throw new Error("Team leader not found");
  }

  // Get all team members who have already confirmed
  const confirmedTeamMembers = await prisma.eventParticipant.findMany({
    where: {
      mainParticipantId: mainParticipantId,
      isConfirmed: true,
    },
    include: {
      user: true,
    },
  });

  // Get all pending (unconfirmed) team members
  const pendingTeamMembers = await prisma.eventParticipant.findMany({
    where: {
      mainParticipantId: mainParticipantId,
      isConfirmed: false,
    },
    include: {
      user: true,
    },
  });

  // Get pending invitation notifications for team members who haven't responded yet
  const pendingNotifications = await prisma.notification.findMany({
    where: {
      type: NotificationType.TEAM_INVITE,
      isRead: false,
      metadata: {
        path: "$.mainParticipantId",
        equals: mainParticipantId.toString(),
      },
    },
  });

  // Transaction to handle all database operations atomically
  await prisma.$transaction(async (tx) => {
    // Delete related TreasureHunt and ClueScans records first (due to foreign key constraints)
    const participantIds = [
      mainParticipantId,
      ...confirmedTeamMembers.map(m => m.id),
      ...pendingTeamMembers.map(m => m.id)
    ];

    await tx.clueScans.deleteMany({
      where: {
        eventParticipationId: {
          in: participantIds,
        },
      },
    });

    await tx.treasureHunt.deleteMany({
      where: {
        eventParticipationId: {
          in: participantIds,
        },
      },
    });

    // Delete all team member participations
    await tx.eventParticipant.deleteMany({
      where: {
        OR: [
          { id: mainParticipantId },
          { mainParticipantId: mainParticipantId },
        ],
      },
    });

    // Decrement participation count for all users
    await tx.user.update({
      where: { id: teamLead.user.id },
      data: {
        eventParticipation: {
          decrement: 1,
        },
      },
    });

    for (const member of [...confirmedTeamMembers, ...pendingTeamMembers]) {
      await tx.user.update({
        where: { id: member.user.id },
        data: {
          eventParticipation: {
            decrement: 1,
          },
        },
      });
    }

    // Mark all pending notifications as read
    if (pendingNotifications.length > 0) {
      for (const notification of pendingNotifications) {
        await tx.notification.update({
          where: { id: notification.id },
          data: { isRead: true },
        });
      }
    }
  });

  // Send cancellation notifications to team leader
  await NotificationService.createNotification({
    userId: teamLead.user.id,
    title: "Team Participation Cancelled",
    message: `Your team for ${teamLead.event.name} has been cancelled because ${userWhoAccepted.name} has joined another team and partial registration is not allowed.`,
    type: NotificationType.EVENT_CANCELLED,
    metadata: {
      eventId: eventId.toString(),
      reason: "MEMBER_JOINED_ANOTHER_TEAM",
    },
  });

  // Send notifications to confirmed team members
  for (const member of confirmedTeamMembers) {
    await NotificationService.createNotification({
      userId: member.user.id,
      title: "Team Participation Cancelled",
      message: `Your participation in ${teamLead.event.name} has been cancelled because ${userWhoAccepted.name} has joined another team and partial registration is not allowed.`,
      type: NotificationType.EVENT_CANCELLED,
      metadata: {
        eventId: eventId.toString(),
        reason: "MEMBER_JOINED_ANOTHER_TEAM",
      },
    });
  }
}
