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

    // Get participant details
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

    if (participant) {
      // Create notification for the team leader
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          title: "Event Result Update",
          message: `Your position in ${event.name} has been updated to ${position}!`,
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
            title: "Event Result Update",
            message: `Your team's position in ${event.name} has been updated to ${position}!`,
            type: NotificationType.GENERAL,
            metadata: {
              eventId,
              position
            }
          }))
        });
      }
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