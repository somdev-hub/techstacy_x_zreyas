import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient, NotificationType } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { eventId, userId, position } = await request.json();

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get participant details with team information
    const participant = await prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId,
      },
      include: {
        user: true,
        otherParticipants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // No longer checking for attendance - removed attendance validation here

    // Update or create the result
    const result = await prisma.eventResult.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      update: {
        position,
      },
      create: {
        eventId,
        userId,
        position,
      },
    });

    // Determine if this is a team event
    const isTeamEvent = participant.otherParticipants.length > 0;

    // Create notification for the participant
    await prisma.notification.create({
      data: {
        userId: participant.userId,
        title: isTeamEvent ? "Congratulations to Your Team!" : "Congratulations on Your Achievement!",
        message: isTeamEvent 
          ? `Your team has achieved ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} position in ${event.name}! Excellent teamwork!`
          : `You've secured ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} position in ${event.name}! Great job!`,
        type: NotificationType.GENERAL,
        metadata: {
          eventId,
          position
        }
      }
    });

    // Create notifications for team members if it's a team event
    if (isTeamEvent) {
      await prisma.notification.createMany({
        data: participant.otherParticipants.map(member => ({
          userId: member.userId,
          title: "Congratulations to Your Team!",
          message: `Your team has achieved ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} position in ${event.name}! Excellent teamwork!`,
          type: NotificationType.GENERAL,
          metadata: {
            eventId,
            position
          }
        }))
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 }
    );
  }
}