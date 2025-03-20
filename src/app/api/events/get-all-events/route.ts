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

    // Get all non-cultural events
    const events = await prisma.event.findMany({
      where: {
        eventType: {
          not: EventType.CULTURAL
        }
      },
      include: {
        eventResults: {
          select: {
            userId: true,
            position: true
          }
        },
        participants: {
          where: {
            mainParticipantId: null // Only get team leaders
          },
          select: {
            id: true,
            userId: true,
            isAttended: true,
            user: {
              select: {
                name: true,
                sic: true
              }
            },
            otherParticipants: {
              select: {
                id: true,
                userId: true,
                isAttended: true,
                user: {
                  select: {
                    name: true,
                    sic: true
                  }
                }
              }
            }
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