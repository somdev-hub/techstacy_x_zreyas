import { PrismaClient, EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const events = await prisma.event.findMany({
      where: {
        eventType: {
          not: EventType.CULTURAL
        }
      },
      select: {
        id: true,
        name: true,
        eventName: true,
        eventType: true,
        eventResults: {
          select: {
            userId: true,
            position: true
          }
        }
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}