import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * model Event {
  id                Int                @id @default(autoincrement())
  name              String
  eventName         Events
  eventType         EventType
  participationType ParticipationType
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  participants      EventParticipant[]
}

model EventParticipant {
  id        Int      @id @default(autoincrement())
  eventId   Int
  userId    Int
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
 */

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { eventId, participants } = data;

    if (!eventId || !participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: "Missing eventId or participants" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, participationType: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Validate participant count based on participation type
    const participantCount = participants.length;
    switch (event.participationType) {
      case "DUO":
        if (participantCount !== 2) {
          return NextResponse.json(
            { error: "DUO events require exactly 2 participants" },
            { status: 400 }
          );
        }
        break;
      case "QUAD":
        if (participantCount !== 4) {
          return NextResponse.json(
            { error: "QUAD events require exactly 4 participants" },
            { status: 400 }
          );
        }
        break;
      case "QUINTET":
        if (participantCount !== 5) {
          return NextResponse.json(
            { error: "QUINTET events require exactly 5 participants" },
            { status: 400 }
          );
        }
        break;
      case "GROUP":
        if (participantCount < 2) {
          return NextResponse.json(
            { error: "GROUP events require at least 2 participants" },
            { status: 400 }
          );
        }
        break;
      case "SOLO":
        if (participantCount !== 1) {
          return NextResponse.json(
            { error: "SOLO events allow only 1 participant" },
            { status: 400 }
          );
        }
        break;
    }

    // Create event participants in a transaction
    const registrations = await prisma.$transaction(
      participants.map(userId => 
        prisma.eventParticipant.create({
          data: {
            eventId,
            userId
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
      )
    );

    // Update event participation count for each user
    await prisma.$transaction(
      participants.map(userId =>
        prisma.user.update({
          where: { id: userId },
          data: {
            eventParticipation: {
              increment: 1
            }
          }
        })
      )
    );

    return NextResponse.json({
      message: "Registration successful",
      registrations
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}