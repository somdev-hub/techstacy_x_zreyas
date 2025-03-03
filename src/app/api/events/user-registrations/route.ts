import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // Get all events where the user is registered (either as main participant or team member)
    const registrations = await prisma.eventParticipant.findMany({
      where: {
        OR: [
          { userId: Number(userId) },
          {
            otherParticipants: {
              some: {
                userId: Number(userId)
              }
            }
          }
        ]
      },
      select: {
        eventId: true
      }
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch user registrations" },
      { status: 500 }
    );
  }
}