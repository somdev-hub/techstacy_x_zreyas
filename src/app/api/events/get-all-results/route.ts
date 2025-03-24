import { PrismaClient, EventType } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all non-cultural events with their results
    const events = await prisma.event.findMany({
      where: {
        eventType: {
          not: EventType.CULTURAL
        }
      },
      select: {
        id: true,
        name: true,
        eventName: true,
        eventType: true,
        participationType: true,
        eventResults: {
          orderBy: {
            position: 'asc'
          },
          where: {
            position: {
              lte: 3 // Only get top 3 positions
            }
          },
          select: {
            position: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                sic: true
              }
            }
          }
        }
      }
    });

    // Process the events to include team members for team events
    const formattedEvents = await Promise.all(events.map(async event => {
      // Get participants with their results and team information
      const eventParticipants = await Promise.all(event.eventResults.map(async result => {
        // Get the team information for this participant
        const participant = await prisma.eventParticipant.findFirst({
          where: {
            eventId: event.id,
            userId: result.userId,
          },
          include: {
            otherParticipants: {
              include: {
                user: {
                  select: {
                    name: true,
                    sic: true
                  }
                }
              }
            }
          }
        });

        // Format the result with team information
        const formattedResult = {
          user: result.user,
          position: result.position,
          teamMembers: participant?.otherParticipants.map(member => ({
            name: member.user.name,
            sic: member.user.sic
          })) || []
        };

        return formattedResult;
      }));

      return {
        id: event.id,
        name: event.name,
        eventName: event.eventName,
        eventType: event.eventType,
        participationType: event.participationType,
        participants: eventParticipants
      };
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error("Failed to fetch event results:", error);
    return NextResponse.json(
      { error: "Failed to fetch event results" },
      { status: 500 }
    );
  }
}