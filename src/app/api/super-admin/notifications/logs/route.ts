import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Only allow super admin to access notification logs
    const user = await userFromRequest(req);
    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters with defaults
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = Math.min(
      parseInt(url.searchParams.get("pageSize") || "20"),
      100
    ); // Limit max page size
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("userId")
      ? parseInt(url.searchParams.get("userId") || "")
      : undefined;
    const startDate = url.searchParams.get("startDate")
      ? new Date(url.searchParams.get("startDate") || "")
      : undefined;
    const endDate = url.searchParams.get("endDate")
      ? new Date(url.searchParams.get("endDate") || "")
      : undefined;

    // Create filter conditions
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (userId) {
      where.userId = userId;
    }

    if (status === "read") {
      where.isRead = true;
    } else if (status === "unread") {
      where.isRead = false;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Count total notifications matching filter
    const total = await prisma.notification.count({ where });

    // Fetch paginated notifications with user info
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get queue items if requested
    interface User {
      id: number;
      name: string;
      email: string;
    }

    interface NotificationQueueItem {
      id: number;
      userId: number;
      sent: boolean;
      createdAt: Date;
      user: User;
    }

    let queueItems: NotificationQueueItem[] = [];
    if (url.searchParams.get("includeQueue") === "true") {
      const queueWhere: any = {};

      if (userId) {
        queueWhere.userId = userId;
      }

      if (status === "sent") {
        queueWhere.sent = true;
      } else if (status === "pending") {
        queueWhere.sent = false;
      }

      if (startDate || endDate) {
        queueWhere.createdAt = {};
        if (startDate) {
          queueWhere.createdAt.gte = startDate;
        }
        if (endDate) {
          queueWhere.createdAt.lte = endDate;
        }
      }

      queueItems = await prisma.notificationQueue.findMany({
        where: queueWhere,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      notifications,
      queueItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (_error) {
    // Error is unused, so prefix with underscore
    return NextResponse.json(
      { error: "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}
