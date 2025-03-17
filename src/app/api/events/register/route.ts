import { PrismaClient, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { NotificationService } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify token
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
        eventType: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Generate QR code
    const qrCode = `${Date.now()}-${eventId}-${userId}`;

    // For solo events
    if (event.participationType === "SOLO") {
      try {
        const registration = await prisma.eventParticipant.create({
          data: {
            eventId: Number(eventId),
            userId: Number(userId),
            isConfirmed: true,
            qrCode,
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
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          return NextResponse.json(
            { error: "You are already registered for this event" },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // For team events
    // Validate participants
    const participantCount = otherParticipants?.length || 0;

    // Get maximum allowed participants based on participation type
    let maxAllowedParticipants: number | null = 1; // Default to 1 (solo)
    let minRequiredParticipants = 1; // Default to 1 (solo)

    switch (event.participationType) {
      case "DUO":
        maxAllowedParticipants = 2; // Main participant + 1 other
        minRequiredParticipants = 2;
        break;
      case "TRIO":
        maxAllowedParticipants = 3; // Main participant + 2 others
        minRequiredParticipants = 3;
        break;
      case "QUAD":
        maxAllowedParticipants = 4; // Main participant + 3 others
        minRequiredParticipants = 4;
        break;
      case "QUINTET":
        maxAllowedParticipants = 5; // Main participant + 4 others
        minRequiredParticipants = 5;
        break;
      case "GROUP":
        maxAllowedParticipants = null; // No maximum limit for GROUP events
        minRequiredParticipants = 2; // At least 2 total (main + 1 other)
        break;
    }

    // Calculate total team size (including main participant)
    const totalTeamSize = 1 + participantCount;

    // Always check maximum limit regardless of partialRegistration (except for GROUP)
    if (maxAllowedParticipants !== null && totalTeamSize > maxAllowedParticipants) {
      return NextResponse.json(
        { 
          error: `Team size (${totalTeamSize}) exceeds the maximum allowed (${maxAllowedParticipants}) for this event type` 
        },
        { status: 400 }
      );
    }

    // Check minimum limit only if partialRegistration is not enabled
    if (!event.partialRegistration && totalTeamSize < minRequiredParticipants) {
      return NextResponse.json(
        { 
          error: `This event requires at least ${minRequiredParticipants} participants (including yourself)`
        },
        { status: 400 }
      );
    }

    // Check for existing registrations for other participants
    if (otherParticipants && otherParticipants.length > 0) {
      interface Participant {
        userId: string;
      }

      const existingTeamRegistrations = await prisma.eventParticipant.findMany({
        where: {
          eventId: Number(eventId),
          userId: {
            in: otherParticipants.map((p: Participant) => Number(p.userId)),
          },
        },
      });

      if (existingTeamRegistrations.length > 0) {
        const existingUsers = existingTeamRegistrations.map(reg => reg.userId);
        return NextResponse.json(
          { 
            error: "Some team members are already registered for this event",
            existingUsers,
          },
          { status: 400 }
        );
      }
    }

    try {
      // Create main participant registration first with QR code
      const mainRegistration = await prisma.eventParticipant.create({
        data: {
          eventId: Number(eventId),
          userId: Number(userId),
          isConfirmed: true,
          qrCode,
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
                // Create event participant record with unique QR code for each member
                const memberQrCode = `${Date.now()}-${eventId}-${participant.userId}`;
                const registration = await prisma.eventParticipant.create({
                  data: {
                    eventId: Number(eventId),
                    userId: Number(participant.userId),
                    isConfirmed: false,
                    mainParticipantId: mainRegistration.id,
                    qrCode: memberQrCode,
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
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return NextResponse.json(
          { error: "You or one of your team members is already registered for this event" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}
