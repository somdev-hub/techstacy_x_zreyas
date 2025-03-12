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

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Get all event participants
    const participants = await prisma.eventParticipant.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            college: true,
            year: true,
            sic: true,
            phone: true
          }
        },
        event: {
          select: {
            id: true,
            name: true,
            eventName: true,
            eventType: true,
            participationType: true,
            imageUrl: true,
            partialRegistration: true
          }
        },
        otherParticipants: {
          // Get team members registered by this participant
          where: {
            mainParticipantId: {
              not: null
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                college: true,
                year: true,
                sic: true,
                phone: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Failed to fetch event participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch event participants" },
      { status: 500 }
    );
  }
}
