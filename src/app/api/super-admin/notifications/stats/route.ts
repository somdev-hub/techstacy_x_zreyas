import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Only allow super admin to access notification statistics
    const user = await userFromRequest(req);
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get timeframe from query parameters (default: last 30 days)
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    // Calculate the start date for the timeframe
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get current date for "today" stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Execute all database queries in parallel for efficiency
    const [
      totalNotifications,
      totalUnreadNotifications,
      notificationsToday,
      notificationsByType,
      notificationsOverTime,
      topRecipients,
    ] = await Promise.all([
      // Total notifications count
      prisma.notification.count(),

      // Total unread notifications
      prisma.notification.count({
        where: { isRead: false },
      }),

      // Notifications sent today
      prisma.notification.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),

      // Notifications by type
      prisma.notification.groupBy({
        by: ["type"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),

      // Notifications over time (last n days)
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date, 
          COUNT(*) as count 
        FROM Notification 
        WHERE createdAt >= ${startDate}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,

      // Top 10 notification recipients
      prisma.notification.groupBy({
        by: ["userId"],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }).then(async (results) => {
        // Get user info for each top recipient
        if (results.length === 0) return [];

        const userIds = results.map((r) => r.userId);
        const users = await prisma.user.findMany({
          where: {
            id: {
              in: userIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        // Merge user info with count data
        return results.map((result) => {
          const user = users.find((u) => u.id === result.userId);
          return {
            userId: result.userId,
            count: result._count.id,
            user,
          };
        });
      }),
    ]);

    return NextResponse.json({
      overview: {
        totalNotifications: Number(totalNotifications),
        totalUnreadNotifications: Number(totalUnreadNotifications),
        notificationsToday: Number(notificationsToday)
      },
      notificationsByType: notificationsByType.map((item) => ({
        type: item.type,
        count: Number(item._count.id),
      })),
      notificationsOverTime: Array.isArray(notificationsOverTime)
        ? notificationsOverTime.map((item) => ({
            ...item,
            count: Number(item.count),
          }))
        : [],
      topRecipients: topRecipients.map((recipient) => ({
        ...recipient,
        count: Number(recipient.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching notification statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification statistics" },
      { status: 500 }
    );
  }
}
