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

    // Check if there are any active treasure hunts
    const activeTreasureHunt = await prisma.eventParticipant.findFirst({
      where: { 
        event: { 
          eventName: "TREASURE_HUNT",
          partialRegistration: true // Using partialRegistration as hunt status flag
        }
      }
    });

    return NextResponse.json({
      status: activeTreasureHunt ? 'running' : 'stopped'
    });

  } catch (error) {
    console.error("Error fetching hunt status:", error);
    return NextResponse.json(
      { error: "Failed to fetch hunt status" },
      { status: 500 }
    );
  }
}