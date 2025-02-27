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

export async function POST(
    req: NextRequest,
    res: NextResponse
    ) {
    const { eventId, userId } = await req.json();
    
    if (!eventId || !userId) {
        return res.json({ error: "Missing eventId or userId" }, { status: 400 });
    }
    
    try {
        const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true }
        });
    
        if (!event) {
        return res.json({ error: "Event not found" }, { status: 404 });
        }
    
        const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
        });
    
        if (!user) {
        return res.json({ error: "User not found" }, { status: 404 });
        }
    
        const eventParticipant = await prisma.eventParticipant.create({
        data: {
            eventId,
            userId
        }
        });
    
        return res.json(eventParticipant);
    } catch (error) {
        console.error("Error registering for event:", error);
        return res.json({ error: "Internal server error" }, { status: 500 });
    }
    }
)