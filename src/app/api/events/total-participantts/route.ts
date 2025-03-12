import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jwt";

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

    // Get count of participants per event
    const participantCounts = await prisma.eventParticipant.groupBy({
      by: ['eventId'],
      _count: {
        userId: true
      }
    });

    // Convert to a simple object with eventId as key and count as value
    const result = participantCounts.reduce((acc, item) => {
      acc[item.eventId] = item._count.userId;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch event participant counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch event participant counts" },
      { status: 500 }
    );
  }
}
