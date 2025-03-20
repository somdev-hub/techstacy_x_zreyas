import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if the event is marked as running
    const event = await prisma.event.findUnique({
      where: { 
        eventName: "TREASURE_HUNT"
      }
    });

    // Check if there are any active treasure hunts (teams with assigned clues)
    const activeTreasureHunt = await prisma.treasureHunt.findFirst();

    return NextResponse.json({
      status: (event?.partialRegistration && activeTreasureHunt) ? 'running' : 'stopped'
    });

  } catch (error) {
    console.error("Error fetching hunt status:", error);
    return NextResponse.json(
      { error: "Failed to fetch hunt status" },
      { status: 500 }
    );
  }
}