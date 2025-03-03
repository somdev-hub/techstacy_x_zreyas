import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // sending total participants in each event along with eventname, eventType, participationType
  try {
    const eventParticipants = await prisma.eventParticipant.findMany({
      select: {
        eventId: true,
      },
    });

    const totalParticipants = eventParticipants.reduce<Record<number, number>>((acc, curr) => {
      if (acc[curr.eventId]) {
        acc[curr.eventId]++;
      } else {
        acc[curr.eventId] = 1;
      }
      return acc;
    }, {});

    return NextResponse.json(totalParticipants);
  } catch (error) {
    console.error("Failed to fetch total participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch total participants" },
      { status: 500 }
    );
  }
}
