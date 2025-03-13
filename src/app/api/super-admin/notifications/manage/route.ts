import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";
import { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Only allow super admin to manage notifications
    const user = await userFromRequest(req);
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "bulkSend": {
        const { title, message, userType, notificationType, year, eventName } = body;

        if (!title || !message || !userType || !notificationType) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }

        // Build user filter with proper type
        const userWhere: any = {};

        // Filter by user type
        if (userType !== "ALL") {
          userWhere.role = userType;
        }

        // Filter by year if specified
        if (year && year !== "ALL") {
          userWhere.year = year;
        }

        // Get users based on filters
        let users;
        if (userType === "EVENT_PARTICIPANTS" && eventName) {
          // Get participants of a specific event
          users = await prisma.user.findMany({
            where: {
              AND: [
                userWhere,
                {
                  eventParticipants: {
                    some: {
                      event: {
                        eventName,
                      },
                    },
                  },
                },
              ],
            },
            select: {
              id: true,
            },
          });
        } else {
          // Get users based on regular filters
          users = await prisma.user.findMany({
            where: userWhere,
            select: {
              id: true,
            },
          });
        }

        // Send notifications
        const result = await NotificationService.sendBulkNotifications({
          userIds: users.map((user) => user.id),
          title,
          message,
          type: notificationType as NotificationType,
        });

        return NextResponse.json({
          message: "Notifications sent successfully",
          sentCount: result,
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
