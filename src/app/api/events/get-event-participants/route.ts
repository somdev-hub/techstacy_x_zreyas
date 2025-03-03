import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const eventParticipants = await prisma.eventParticipant.findMany({
      select: {
        id: true,
        eventId: true,
        userId: true,
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
            name: true,
            eventName: true,
            eventType: true,
            imageUrl: true,
          },
        },
        mainParticipantId: true,
        otherParticipants: {
          select: {
            id: true,
            userId: true,
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

    // Filter out entries where mainParticipantId is not null and otherParticipants is empty
    const filteredParticipants = eventParticipants.filter(
      participant => 
        !(participant.mainParticipantId !== null && participant.otherParticipants.length === 0)
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
