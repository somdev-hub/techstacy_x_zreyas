import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    // Get participant's treasure hunt progress
    const participant = await prisma.eventParticipant.findFirst({
      where: {
        OR: [
          {
            userId: parseInt(decoded.userId),
            event: { eventName: "TREASURE_HUNT" },
            teamLeader: true,
            mainParticipantId: null
          },
          {
            mainParticipant: {
              event: { eventName: "TREASURE_HUNT" },
              userId: parseInt(decoded.userId)
            }
          }
        ]
      },
      include: {
        treasureHunt: {
          include: {
            clues: {
              include: {
                firstClue: true,
                secondClue: true,
                thirdClue: true,
                finalClue: true,
              }
            }
          }
        },
        clueScans: {
          include: {
            clueObject: true,
          },
          orderBy: {
            scannedAt: 'desc'
          }
        }
      }
    });

    // If participant not found, they are not registered
    if (!participant) {
      return NextResponse.json(
        { error: 'Team not registered' },
        { status: 404 }
      );
    }

    // Check if attendance is marked
    const isAttendanceMarked = participant.isAttended ?? false;

    if (!participant?.treasureHunt || !isAttendanceMarked) {
      return NextResponse.json({
        clues: [],
        latestClue: null,
        isHuntStarted: false,
        currentClueNumber: 0,
        isAttendanceMarked,
      });
    }

    const scannedClues = participant.clueScans.map((scan, index) => ({
      clue: scan.clueObject.clue,
      scannedAt: scan.scannedAt.toISOString(),
      isLatest: index === 0,
      clueNumber: index + 1
    }));

    const isHuntStarted = true; // Since clues are assigned
    const currentClueNumber = scannedClues.length + 1;
    const latestClue = scannedClues[0]?.clue || participant.treasureHunt.clues.firstClue.clue;

    return NextResponse.json({
      clues: scannedClues,
      latestClue,
      isHuntStarted,
      currentClueNumber,
      isAttendanceMarked,
    });

  } catch (error) {
    console.error("Failed to fetch clues:", error);
    return NextResponse.json(
      { error: "Failed to fetch clues" },
      { status: 500 }
    );
  }
}