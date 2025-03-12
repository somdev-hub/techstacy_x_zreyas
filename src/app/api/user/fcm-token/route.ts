import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { fcmToken } = data;

    if (!fcmToken) {
      console.error("Missing FCM token in request");
      return NextResponse.json(
        { error: "FCM token is required" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const origin = req.nextUrl.origin;
    console.log("Request origin:", origin);
    console.log("Request headers:", Object.fromEntries(headersList.entries()));

    // Get user from /api/user/me
    const userResponse = await fetch(`${origin}/api/user/me`, {
      headers: {
        Cookie: headersList.get("cookie") || "",
        Host: headersList.get("host") || "",
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("User authentication failed:", {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: "Unauthorized - Failed to verify user" },
        { status: 401 }
      );
    }

    const user = await userResponse.json();
    console.log("User data retrieved:", { id: user.id, email: user.email });

    if (!user.id) {
      console.error("Invalid user data:", user);
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    // Update user's FCM token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken },
      select: { id: true, fcmToken: true },
    });

    console.log("User FCM token updated:", updatedUser);

    return NextResponse.json({
      message: "FCM token updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return NextResponse.json(
      { error: "Internal server error while updating FCM token" },
      { status: 500 }
    );
  }
}
