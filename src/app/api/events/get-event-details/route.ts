import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('eventName');

    if (!eventName) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 });
    }

    // First get the event
    const event = await prisma.event.findUnique({
      where: { eventName: eventName as any },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get all team leaders (participants with mainParticipantId as null) for this event
    const participants = await prisma.eventParticipant.findMany({
      where: {
        eventId: event.id,
        mainParticipantId: null, // Only get team leaders
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            sic: true,
            year: true,
            imageUrl: true,
          }
        },
        otherParticipants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                sic: true,
                year: true,
                imageUrl: true,
              }
            }
          }
        }
      }
    });

    // Format the data to match the expected structure
    const formattedTeams = participants.map(participant => {
      if (!participant.user || !participant.user.name) {
        return null; // Skip if user data is missing
      }

      return {
        teamLeader: {
          id: participant.id.toString(),
          name: participant.user.name,
          sic: participant.user.sic,
          year: participant.user.year,
          imageUrl: participant.user.imageUrl,
          isConfirmed: true // Team leaders are always confirmed
        },
        members: participant.otherParticipants
          .filter(member => member.user && member.user.name) // Filter out members with missing data
          .map(member => ({
            id: member.id.toString(),
            name: member.user.name,
            sic: member.user.sic,
            year: member.user.year,
            imageUrl: member.user.imageUrl,
            isConfirmed: member.isConfirmed
          }))
      };
    }).filter(team => team !== null); // Remove any null teams

    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error("Failed to fetch event participation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch event participation details" },
      { status: 500 }
    );
  }
}