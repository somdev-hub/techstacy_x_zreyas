import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { NotificationService } from "@/lib/notification-service";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

// Create a Redis client for rate limiting if configuration exists
let ratelimit: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "notifications_api",
  });
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      console.log("No token found in cookies");
      
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify token
    // const token = accessToken.split("=")[1];
    const decoded = await verifyAccessToken(token);

    if (!decoded.userId || !decoded.email) {
      console.log("No token found in cookies");
      
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Apply rate limiting if configured
    if (ratelimit) {
      const identifier = `notifications:${decoded?.userId}`;
      const { success, limit, remaining, reset } = await ratelimit.limit(
        identifier
      );

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Rate limit exceeded", retryAfter },
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

    // Get notifications for the user
    const notifications = await NotificationService.getRecentNotifications(
      Number(decoded?.userId)
    );

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
