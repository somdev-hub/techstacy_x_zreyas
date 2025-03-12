import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a Redis client for rate limiting if configuration exists
let ratelimit: Ratelimit | null = null;

// Increase rate limit for production use
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Allow 30 requests per minute with burst capacity
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "notifications_api",
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting if configured
    if (ratelimit) {
      const identifier = `notifications:${user.id}`;
      // Increase rate limit for super admin users
      const { success, limit, remaining, reset } =
        user.role === "SUPERADMIN"
          ? await ratelimit.limit(identifier)
          : await ratelimit.limit(identifier);

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }
    }

    // Extract optional query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const includeRead = url.searchParams.get("includeRead") === "true";

    // Get notifications with the provided filters
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(includeRead ? {} : { isRead: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: Math.min(limit, 100), // Cap at 100 to prevent abuse
    });

    return NextResponse.json(notifications, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Expires: "0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
