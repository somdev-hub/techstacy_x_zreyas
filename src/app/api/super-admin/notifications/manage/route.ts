import { NextRequest, NextResponse } from "next/server";
import {
  NotificationType,
  PrismaClient,
  Events,
  Role,
  Year,
} from "@prisma/client";

interface NotificationMetadata {
  [key: string]: any;
}
import { verifyAccessToken } from "@/lib/jose-auth";
import { NotificationService } from "@/lib/notification-service";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || decoded.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "bulkSend": {
        const { title, message, userType, notificationType, year, eventName } =
          body;

        if (!title || !message || !userType || !notificationType) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }

        // Build user filter with proper type
        const userWhere: {
          role?: Role;
          year?: Year;
        } = {};

        // Filter by user type
        if (userType !== "ALL") {
          userWhere.role = userType as Role;
        }

        // Filter by year if specified
        if (year && year !== "ALL") {
          userWhere.year = year as Year;
        }

        // Get users based on filters
        let users;
        if (userType === "EVENT_PARTICIPANTS" && eventName) {
          // Get participants of a specific event using event enum
          users = await prisma.user.findMany({
            where: {
              AND: [
                userWhere,
                {
                  eventParticipants: {
                    some: {
                      event: {
                        eventName: eventName as Events,
                      },
                    },
                  },
                },
              ],
            },
            select: {
              id: true,
              fcmToken: true,
            },
          });
        } else {
          // Get users based on regular filters
          users = await prisma.user.findMany({
            where: userWhere,
            select: {
              id: true,
              fcmToken: true,
            },
          });
        }

        // Create notifications for each user
        const notifications = await Promise.all(
          users.map((user) =>
            NotificationService.createNotification({
              userId: user.id,
              title,
              message,
              type: notificationType as NotificationType,
            })
          )
        );

        // Send push notifications to users with FCM tokens
        if (users.some((user) => user.fcmToken)) {
          await NotificationService.sendBulkNotifications({
            userIds: users
              .filter((user) => user.fcmToken)
              .map((user) => user.id),
            title,
            message,
            type: notificationType,
            metadata: {},
          });
        }

        return NextResponse.json({
          message: "Notifications sent successfully",
          sentCount: notifications.length,
        });
      }

      case "purge": {
        const { olderThan, read } = body;
        const date = new Date();
        date.setDate(date.getDate() - olderThan);

        const deleteResult = await prisma.notification.deleteMany({
          where: {
            createdAt: {
              lt: date,
            },
            ...(read ? { isRead: true } : {}),
          },
        });

        return NextResponse.json({
          message: "Old notifications purged",
          deletedCount: deleteResult.count,
        });
      }

      case "retryFailed": {
        const { maxAge = 7 } = body;
        const date = new Date();
        date.setDate(date.getDate() - maxAge);

        const failedNotifications = await prisma.notificationQueue.findMany({
          where: {
            sent: false,
            createdAt: {
              gte: date,
            },
          },
          include: {
            user: {
              select: {
                fcmToken: true,
              },
            },
          },
        });

        const retryResults = await Promise.all(
          failedNotifications.map(async (notification) => {
            if (notification.user.fcmToken) {
              try {
                await NotificationService.sendBulkNotifications({
                  userIds: [notification.userId],
                  title: notification.title,
                  message: notification.message,
                  metadata:
                    typeof notification.metadata === "object" &&
                    notification.metadata !== null
                      ? (notification.metadata as NotificationMetadata)
                      : {},
                });

                await prisma.notificationQueue.update({
                  where: { id: notification.id },
                  data: {
                    sent: true,
                    sentAt: new Date(),
                  },
                });

                return true;
              } catch (error) {
                console.error("Failed to retry notification:", error);
                return false;
              }
            }
            return false;
          })
        );

        const successCount = retryResults.filter(Boolean).length;

        return NextResponse.json({
          message: `Successfully retried ${successCount} of ${failedNotifications.length} notifications`,
          successCount,
          totalAttempted: failedNotifications.length,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Notification management error:", error);
    return NextResponse.json(
      { error: "Failed to process notification action" },
      { status: 500 }
    );
  }
}
