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

    // Get participant's treasure hunt progress with all required relations
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
            clueObject: true
          },
          orderBy: {
            scannedAt: 'asc' // Keep ascending order to maintain chronological sequence
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
        hasScannedWinnerQr: false,
      });
    }

    // Initialize clue history array
    let clueHistory: {
      clue: string;
      scannedAt: string;
      isLatest: boolean;
      clueNumber: number;
      isAssigned?: boolean;
    }[] = [];

    // Add initial clue (always revealed)
    clueHistory.push({
      clue: participant.treasureHunt.clues.firstClue.clue,
      scannedAt: participant.createdAt.toISOString(),
      isLatest: participant.clueScans.length === 0,
      clueNumber: 1,
      isAssigned: true
    });

    // Map scanned clues to their correct clue numbers
    for (const scan of participant.clueScans) {
      let clueNumber;
      const clueId = scan.clueObjectId;
      const assignedClues = participant.treasureHunt.clues;

      // Match clue IDs to determine proper sequence
      if (clueId === assignedClues.secondClueId) {
        clueNumber = 2;
      } else if (clueId === assignedClues.thirdClueId) {
        clueNumber = 3;
      } else if (clueId === assignedClues.finalClueId) {
        clueNumber = 4;
      }

      // Only add the clue if we found its proper number
      if (clueNumber) {
        clueHistory.push({
          clue: scan.clueObject.clue,
          scannedAt: scan.scannedAt.toISOString(),
          isLatest: scan === participant.clueScans[participant.clueScans.length - 1] 
            && !participant.treasureHunt.hasScannedWinnerQr,
          clueNumber
        });
      }
    }

    // Add winner clue if scanned
    if (participant.treasureHunt.hasScannedWinnerQr) {
      const winnerClue = await prisma.winnerClue.findFirst();
      if (winnerClue) {
        // Add winner clue as the latest
        clueHistory.push({
          clue: winnerClue.clue + " 🏆",
          scannedAt: participant.treasureHunt.winnerScanTime!.toISOString(),
          isLatest: true,
          clueNumber: 5 // Winner clue is always #5
        });
        
        // Ensure no other clue is marked as latest
        clueHistory = clueHistory.map(c => ({
          ...c,
          isLatest: c.clueNumber === 5
        }));
      }
    }

    // Sort by clue number to maintain proper sequence
    clueHistory.sort((a, b) => a.clueNumber - b.clueNumber);

    const isHuntStarted = true; // Since clues are assigned
    const currentClueNumber = participant.clueScans.length + 1;
    const latestClue = clueHistory.find(c => c.isLatest)?.clue || participant.treasureHunt.clues.firstClue.clue;

    return NextResponse.json({
      clues: clueHistory,
      latestClue,
      isHuntStarted,
      currentClueNumber,
      isAttendanceMarked,
      hasScannedWinnerQr: participant.treasureHunt.hasScannedWinnerQr || false,
    });

  } catch (error) {
    console.error("Failed to fetch clues:", error);
    return NextResponse.json(
      { error: "Failed to fetch clues" },
      { status: 500 }
    );
  }
}