import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendNotification } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { eventId, otherParticipants } = data;

    const headersList = headers();
    const protocol = req.nextUrl.protocol;
    const host = headersList.get('host') || req.nextUrl.host;
    const baseUrl = `${protocol}//${host}`;
    console.log('Base URL:', baseUrl);

    // Get user from /api/user/me with constructed URL
    const userResponse = await fetch(`${baseUrl}/api/user/me`, {
      headers: {
        'Cookie': headersList.get('cookie') || '',
        'Host': host
      }
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await userResponse.json();
    const userId = user.id;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      select: { id: true, participationType: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // For solo events
    if (event.participationType === "SOLO") {
      const registration = await prisma.eventParticipant.create({
        data: {
          eventId: Number(eventId),
          userId: Number(userId),
          isConfirmed: true,
          qrCode: `${Date.now()}-${eventId}-${userId}` // Generate QR code
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      await prisma.user.update({
        where: { id: Number(userId) },
        data: {
          eventParticipation: {
            increment: 1
          }
        }
      });

      return NextResponse.json({
        message: "Solo registration successful",
        registration
      });
    }

    // For team events
    const participantCount = otherParticipants ? otherParticipants.length + 1 : 1;

    // Validate participant count based on participation type
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
    }

    // Create main participant registration first
    const mainRegistration = await prisma.eventParticipant.create({
      data: {
        eventId: Number(eventId),
        userId: Number(userId),
        isConfirmed: true,
        qrCode: `${Date.now()}-${eventId}-${userId}` // Generate QR code
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        event: {
          select: {
            name: true
          }
        }
      }
    });

    // Create registrations for other team members and send notifications
    const otherRegistrations = await Promise.all(
      otherParticipants.map(async (participant: { userId: string }) => {
        // Get user's FCM token
        const user = await prisma.user.findUnique({
          where: { id: Number(participant.userId) },
          select: { fcmToken: true }
        });

        // Create event participant record
        const registration = await prisma.eventParticipant.create({
          data: {
            eventId: Number(eventId),
            userId: Number(participant.userId),
            isConfirmed: false,
            qrCode: `${Date.now()}-${eventId}-${participant.userId}`,
            mainParticipantId: mainRegistration.id
          }
        });

        // Create notification record
        const notification = await prisma.notification.create({
          data: {
            userId: Number(participant.userId),
            title: "Team Invite",
            message: `${mainRegistration.user.name} has added you to their team for ${mainRegistration.event.name}`,
            type: "TEAM_INVITE",
            metadata: {
              participantId: registration.id,
              eventId: eventId,
              mainParticipantId: mainRegistration.id,
              mainParticipantName: mainRegistration.user.name
            }
          }
        });

        // Send push notification if user has FCM token
        if (user?.fcmToken) {
          await sendNotification(
            user.fcmToken,
            notification.title,
            notification.message,
            {
              notificationId: notification.id.toString(),
              type: "TEAM_INVITE",
              eventId: eventId.toString()
            }
          );
        }

        return registration;
      })
    );

    // Update event participation count for all users
    await prisma.$transaction([
      prisma.user.update({
        where: { id: Number(userId) },
        data: {
          eventParticipation: {
            increment: 1
          }
        }
      }),
      ...otherParticipants.map((participant: { userId: string }) =>
        prisma.user.update({
          where: { id: Number(participant.userId) },
          data: {
            eventParticipation: {
              increment: 1
            }
          }
        })
      )
    ]);

    return NextResponse.json({
      message: "Team registration successful",
      mainRegistration,
      otherRegistrations
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}