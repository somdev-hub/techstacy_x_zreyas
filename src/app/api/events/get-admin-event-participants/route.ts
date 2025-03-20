import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    let userId;
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
      } else {
        userId = decoded.userId;
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const eventIds = await prisma.eventHead.findMany({
      where: {
        userId: parseInt(userId),
      },
      select: {
        eventId: true,
      },
    });

    const eventParticipants = await prisma.eventParticipant.findMany({
      where: {
        eventId: {
          in: eventIds.map((event) => event.eventId),
        },
      },
      select: {
        id: true,
        eventId: true,
        userId: true,
        mainParticipantId: true,
        isAttended: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            college: true,
            year: true,
            sic: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            eventName: true,
            eventType: true,
            participationType: true,
            imageUrl: true,
            eventResults: {
              select: {
                userId: true,
                position: true,
              },
            },
          },
        },
        otherParticipants: {
          where: {
            mainParticipantId: {
              not: null,
            },
          },
          select: {
            id: true,
            userId: true,
            isConfirmed: true,
            isAttended: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                college: true,
                year: true,
                sic: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    const filteredParticipants = eventParticipants.filter(
      (participant) =>
        !(
          participant.mainParticipantId !== null &&
          participant.otherParticipants.length === 0
        )
    );

    return NextResponse.json(filteredParticipants);
  } catch (error) {
    console.error("Failed to fetch event participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch event participants" },
      { status: 500 }
    );
  }
}
