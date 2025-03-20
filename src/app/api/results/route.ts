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
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const { eventId, userId, position } = await request.json();

    // Verify the user is an event head for this event
    const isEventHead = await prisma.eventHead.findFirst({
      where: {
        eventId,
        userId: parseInt(decoded.userId)
      },
      include: {
        event: true
      }
    });

    if (!isEventHead) {
      return NextResponse.json(
        { error: "Not authorized to manage this event" },
        { status: 403 }
      );
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

    // Check if the main participant has attended
    if (!participant.isAttended) {
      return NextResponse.json({ error: "Main participant has not attended the event" }, { status: 400 });
    }

    // For team events, check if all team members have attended
    if (participant.otherParticipants.length > 0) {
      const notAttendedMembers = participant.otherParticipants.filter(member => !member.isAttended);
      if (notAttendedMembers.length > 0) {
        return NextResponse.json({ 
          error: "Cannot assign result - some team members have not attended", 
          notAttendedMembers: notAttendedMembers.map(m => m.user.name)
        }, { status: 400 });
      }
    }

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

    // Create notification for the team leader
    await prisma.notification.create({
      data: {
        userId: participant.userId,
        title: "Event Result Announcement",
        message: `Congratulations! You secured position ${position} in ${isEventHead.event.name}!`,
        type: NotificationType.GENERAL,
        metadata: {
          eventId,
          position
        }
      }
    });

    // Create notifications for team members if it's a team event
    if (participant.otherParticipants.length > 0) {
      await prisma.notification.createMany({
        data: participant.otherParticipants.map(member => ({
          userId: member.userId,
          title: "Event Result Announcement",
          message: `Congratulations! Your team secured position ${position} in ${isEventHead.event.name}!`,
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
    console.error("Error saving result:", error);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    );
  }
}