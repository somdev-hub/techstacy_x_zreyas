import { PrismaClient, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { NotificationService } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Get token from cookies

    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify token
    // const token = accessToken.split("=")[1];
    const decoded = await verifyAccessToken(token);

    if (!decoded.userId || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get request data
    const data = await req.json();
    const { eventId, userId, otherParticipants } = data;

    // Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Ensure the main registrant is the logged-in user
    if (Number(decoded.userId) !== Number(userId)) {
      console.log("User ID mismatch", decoded.userId, userId);

      return NextResponse.json(
        {
          error:
            "You can only register events for yourself as the main participant",
        },
        { status: 403 }
      );
    }

    // Get the event to check its participation type
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      select: {
        id: true,
        name: true,
        participationType: true,
        partialRegistration: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // For solo events
    if (event.participationType === "SOLO") {
      const registration = await prisma.eventParticipant.create({
        data: {
          eventId: Number(eventId),
          userId: Number(userId),
          isConfirmed: true,
          qrCode: `${Date.now()}-${eventId}-${userId}`, // Generate QR code
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: Number(userId) },
        data: {
          eventParticipation: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        message: "Registration successful",
        registration,
      });
    }

    // For team events
    // Validate participants
    const participantCount = otherParticipants?.length || 0;

    // Enforce participation type constraints unless partial registration is enabled
    if (!event.partialRegistration) {
      switch (event.participationType) {
        case "DUO":
          if (participantCount !== 1) {
            return NextResponse.json(
              { error: "DUO events require exactly 1 additional participant" },
              { status: 400 }
            );
          }
          break;
        case "TRIO":
          if (participantCount !== 2) {
            return NextResponse.json(
              {
                error: "TRIO events require exactly 2 additional participants",
              },
              { status: 400 }
            );
          }
          break;
        case "QUAD":
          if (participantCount !== 3) {
            return NextResponse.json(
              {
                error: "QUAD events require exactly 3 additional participants",
              },
              { status: 400 }
            );
          }
          break;
        case "QUINTET":
          if (participantCount !== 4) {
            return NextResponse.json(
              {
                error:
                  "QUINTET events require exactly 4 additional participants",
              },
              { status: 400 }
            );
          }
          break;
        case "GROUP":
          if (participantCount < 1) {
            return NextResponse.json(
              {
                error: "GROUP events require at least 1 additional participant",
              },
              { status: 400 }
            );
          }
          break;
      }
    }
    // When partialRegistration is enabled, we don't enforce any minimum requirements
    // This allows users to register solo or with any number of teammates

    // Create main participant registration first
    const mainRegistration = await prisma.eventParticipant.create({
      data: {
        eventId: Number(eventId),
        userId: Number(userId),
        isConfirmed: true,
        qrCode: `${Date.now()}-${eventId}-${userId}`, // Generate QR code
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create registrations for other team members and send notifications (if any)
    const otherRegistrations =
      otherParticipants && otherParticipants.length > 0
        ? await Promise.all(
            otherParticipants.map(async (participant: { userId: string }) => {
              // Create event participant record
              const registration = await prisma.eventParticipant.create({
                data: {
                  eventId: Number(eventId),
                  userId: Number(participant.userId),
                  isConfirmed: false,
                  qrCode: `${Date.now()}-${eventId}-${participant.userId}`,
                  mainParticipantId: mainRegistration.id,
                },
              });

              // Send team invite notification via our notification service
              await NotificationService.createNotification({
                userId: Number(participant.userId),
                title: "Team Invite",
                message: `${mainRegistration.user.name} has added you to their team for ${mainRegistration.event.name}`,
                type: NotificationType.TEAM_INVITE,
                metadata: {
                  participantId: String(registration.id),
                  eventId,
                  mainParticipantId: String(mainRegistration.id),
                  mainParticipantName: mainRegistration.user.name,
                },
              });

              return registration;
            })
          )
        : [];

    // Update event participation count for main user
    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        eventParticipation: {
          increment: 1,
        },
      },
    });

    // Update event participation count for other users (if any)
    if (otherParticipants && otherParticipants.length > 0) {
      await Promise.all(
        otherParticipants.map((participant: { userId: string }) =>
          prisma.user.update({
            where: { id: Number(participant.userId) },
            data: {
              eventParticipation: {
                increment: 1,
              },
            },
          })
        )
      );
    }

    return NextResponse.json({
      message: "Team registration successful",
      mainRegistration,
      otherRegistrations,
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}
