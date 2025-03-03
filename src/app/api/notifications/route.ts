import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const protocol = req.nextUrl.protocol;
    const host = headersList.get("host") || req.nextUrl.host;
    const baseUrl = `${protocol}//${host}`;

    const userResponse = await fetch(`${baseUrl}/api/user/me`, {
      headers: {
        Cookie: headersList.get("cookie") || "",
        Host: host,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userResponse.json();

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
