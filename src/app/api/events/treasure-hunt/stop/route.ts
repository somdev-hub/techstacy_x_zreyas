import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
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

    // Delete all treasure hunt entries to deassign clues
    await prisma.treasureHunt.deleteMany({
      where: {
        eventParticipant: {
          event: { eventName: "TREASURE_HUNT" }
        }
      }
    });

    // Update the event status to stopped
    await prisma.event.update({
      where: { eventName: "TREASURE_HUNT" },
      data: { partialRegistration: false }  // Using partialRegistration as hunt status flag
    });

    return NextResponse.json({ message: "Hunt stopped successfully" });

  } catch (error) {
    console.error("Error stopping hunt:", error);
    return NextResponse.json(
      { error: "Failed to stop hunt" },
      { status: 500 }
    );
  }
}
