import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { eventId, otherParticipants } = data;

    const headersList = await headers();
    const protocol = req.nextUrl.protocol;
    const host = headersList.get("host") || req.nextUrl.host;
    const baseUrl = `${protocol}//${host}`;

    // Get user from /api/user/me with constructed URL
    const userResponse = await fetch(`${baseUrl}/api/user/me`, {
      headers: {
        Cookie: headersList.get("cookie") || "",
        Host: host,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userResponse.json();
    const userId = user.id;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      select: {
        id: true,
        participationType: true,
        eventType: true,
        partialRegistration: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.eventType !== "CULTURAL") {
      return NextResponse.json(
        { error: "This route is only for cultural events" },
        { status: 400 }
      );
    }

    // For solo events
    if (event.participationType === "SOLO") {
      const registration = await prisma.eventParticipant.create({
        data: {
          eventId: Number(eventId),
          userId: Number(userId),
          isConfirmed: true,
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
        message: "Solo registration successful",
        registration,
      });
    }

    // For team events
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
    const totalTeamSize = 1 + (otherParticipants?.length || 0);

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

    // Create main participant registration first
    const mainRegistration = await prisma.eventParticipant.create({
      data: {
        eventId: Number(eventId),
        userId: Number(userId),
        isConfirmed: true,
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

    // Create registrations for other team members
    const otherRegistrations = otherParticipants && otherParticipants.length > 0 ? 
      await Promise.all(
        otherParticipants.map(async (participant: { userId: string }) => {
          // Create event participant record
          const registration = await prisma.eventParticipant.create({
            data: {
              eventId: Number(eventId),
              userId: Number(participant.userId),
              isConfirmed: false,
              mainParticipantId: mainRegistration.id,
            },
          });

          // Create notification record
          await prisma.notification.create({
            data: {
              userId: Number(participant.userId),
              title: "Cultural Team Invite",
              message: `${mainRegistration.user.name} has added you to their team for ${mainRegistration.event.name}`,
              type: "TEAM_INVITE",
              metadata: {
                participantId: registration.id,
                eventId: eventId,
                mainParticipantId: mainRegistration.id,
                mainParticipantName: mainRegistration.user.name,
              },
            },
          });

          return registration;
        })
      ) : [];

    // Update event participation count for all users
    await prisma.$transaction([
      prisma.user.update({
        where: { id: Number(userId) },
        data: {
          eventParticipation: {
            increment: 1,
          },
        },
      }),
      ...(otherParticipants && otherParticipants.length > 0 ? 
        otherParticipants.map((participant: { userId: string }) =>
          prisma.user.update({
            where: { id: Number(participant.userId) },
            data: {
              eventParticipation: {
                increment: 1,
              },
            },
          })
        ) : []),
    ]);

    return NextResponse.json({
      message: "Team registration successful",
      mainRegistration,
      otherRegistrations,
    });
  } catch (error) {
    console.error("Error registering for cultural event:", error);
    return NextResponse.json(
      { error: "Failed to register for cultural event" },
      { status: 500 }
    );
  }
}
