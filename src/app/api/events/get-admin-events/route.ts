import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const decoded = await verifyAccessToken(token);
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 }
        );
      }

      // Get events where the user is an event head
      const eventHeads = await prisma.eventHead.findMany({
        where: { userId: parseInt(decoded.userId) },
        select: {
          event: {
            select: {
              id: true,
              eventName: true
            }
          }
        }
      });

      // Transform the data to match the expected format
      const adminEvents = eventHeads.map(eh => ({
        id: eh.event.id,
        eventName: eh.event.eventName
      }));

      return NextResponse.json(adminEvents);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin events" },
      { status: 500 }
    );
  }
}