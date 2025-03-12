import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { NotificationService } from "@/lib/notification-service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = parseInt(params.id);
    
    // Validate notification ID
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    // Get user from request
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Use our notification service to mark the notification as read
      // This will also verify ownership
      await NotificationService.markAsRead(notificationId, user.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      // Handle specific error from NotificationService
      if (error instanceof Error && error.message.includes('not found or does not belong')) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }
      throw error; // Re-throw for the generic error handler
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}