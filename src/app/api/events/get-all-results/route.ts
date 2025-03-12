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

    // Transform the data to match our frontend expectations
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      eventName: event.eventName,
      eventType: event.eventType,
      participants: event.eventResults.map(result => ({
        user: result.user,
        position: result.position
      }))
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