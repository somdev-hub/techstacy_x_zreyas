import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { NotificationService } from "@/lib/notification-service";

export async function POST(req: NextRequest) {
  try {
    // Get user from request
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use notification service to clear notifications, preserving unread team invites
    const clearedCount = await NotificationService.clearNotifications(user.id);
    
    return NextResponse.json({ 
      success: true,
      clearedCount: clearedCount
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
