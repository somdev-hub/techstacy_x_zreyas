import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const origin = req.nextUrl.origin;
    const headersList = await headers();

    // Get user from /api/user/me using the same origin
    const userResponse = await fetch(`${origin}/api/user/me`, {
      headers: {
        Cookie: headersList.get("cookie") || "",
      },
    });

    if (!userResponse.ok) {
      console.error("User response status:", userResponse.status);
      console.error("User response body:", await userResponse.text());
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await userResponse.json();
    const userId = user.id;

    // Get all events where the user is registered, including team information
    const registrations = await prisma.eventParticipant.findMany({
      where: {
        OR: [
          { userId: Number(userId) },
          {
            mainParticipant: {
              userId: Number(userId),
            },
          },
        ],
      },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            sic: true,
          },
        },
        mainParticipant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                sic: true,
              },
            },
            otherParticipants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    sic: true,
                  },
                },
              },
            },
          },
        },
        otherParticipants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                sic: true,
              },
            },
          },
        },
      },
    });

    // Create a Set to store unique event IDs
    const uniqueEvents = new Map();

    registrations.forEach((reg) => {
      // If this event is not in our map or if this is the main registration, add/update it
      if (!uniqueEvents.has(reg.eventId) || reg.mainParticipantId === null) {
        const teammates = [];

        // If this is a main participant registration, add other team members
        if (reg.mainParticipantId === null) {
          teammates.push({
            id: reg.user.id,
            name: reg.user.name,
            imageUrl: reg.user.imageUrl,
            sic: reg.user.sic,
            isMainParticipant: true,
            isConfirmed: reg.isConfirmed,
          });

          // Add other team members
          reg.otherParticipants.forEach((member) => {
            teammates.push({
              id: reg.user.id,
              name: member.user.name,
              imageUrl: member.user.imageUrl,
              sic: member.user.sic,
              isMainParticipant: false,
              isConfirmed: member.isConfirmed,
            });
          });
        } else if (reg.mainParticipant) {
          // If this is a team member registration, get the main participant and all members
          teammates.push({
            id: reg.user.id,
            name: reg.mainParticipant.user.name,
            imageUrl: reg.mainParticipant.user.imageUrl,
            sic: reg.mainParticipant.user.sic,
            isMainParticipant: true,
            isConfirmed: reg.mainParticipant.isConfirmed,
          });

          reg.mainParticipant.otherParticipants.forEach((member) => {
            teammates.push({
              id: reg.user.id,
              name: member.user.name,
              imageUrl: member.user.imageUrl,
              sic: member.user.sic,
              isMainParticipant: false,
              isConfirmed: member.isConfirmed,
            });
          });
        }

        uniqueEvents.set(reg.eventId, {
          id: reg.event.id,
          name: reg.event.name,
          date: reg.event.date.toISOString().split("T")[0],
          time: reg.event.time,
          description: reg.event.description,
          imageUrl: reg.event.imageUrl,
          eventName: reg.event.eventName,
          participationType: reg.event.participationType,
          eventType: reg.event.eventType,
          registrationFee: 0,
          prizePool: reg.event.prizePool,
          qrCode: reg.qrCode || `${reg.id}-${reg.eventId}-${userId}`,
          isAttended: reg.isAttended,
          teammates: teammates,
        });
      }
    });

    return NextResponse.json(Array.from(uniqueEvents.values()));
  } catch (error) {
    console.error("Error fetching user events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
