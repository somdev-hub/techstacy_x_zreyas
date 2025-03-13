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

    const teams = await prisma.eventParticipant.findMany({
      where: {
        event: {
          eventName: "TREASURE_HUNT"
        },
        teamLeader: true,
        mainParticipantId: null // Only get team leaders
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
        user: {
          select: {
            name: true
          }
        },
        otherParticipants: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        clueScans: {
          include: {
            clueObject: {
              select: {
                clue: true
              }
            }
          },
          orderBy: {
            scannedAt: 'desc'
          }
        }
      }
    });

    // Fetch winner clue to add it to the list of scanned clues
    const winnerClue = await prisma.winnerClue.findFirst();

    const formattedTeams = teams.map(team => {
      // Create the team's scanned clues array
      const scannedClues = team.clueScans.map(scan => ({
        clueId: scan.clueObjectId,
        scannedAt: scan.scannedAt.toISOString(),
        clue: {
          clue: scan.clueObject.clue
        }
      }));
      
      // If team has scanned the winner QR, add it to the list of scanned clues
      if (team.treasureHunt?.hasScannedWinnerQr && winnerClue) {
        scannedClues.unshift({
          clueId: -1, // Special ID for winner clue
          scannedAt: team.treasureHunt.winnerScanTime?.toISOString() || new Date().toISOString(),
          clue: {
            clue: winnerClue.clue + " 🏆"
          }
        });
      }

      return {
        eventParticipationId: team.id,
        teamName: team.user.name,
        teamMembers: [
          team.user.name,
          ...team.otherParticipants.map(member => member.user.name)
        ],
        currentClue: team.treasureHunt?.hasScannedWinnerQr 
          ? 5 // Winner clue is considered clue #5
          : team.treasureHunt 
            ? (team.clueScans.length + 1 <= 4 ? team.clueScans.length + 1 : 4) 
            : 0,
        scannedClues,
        assignedClues: team.treasureHunt?.clues ? {
          id: team.treasureHunt.clues.id,
          firstClue: { clue: team.treasureHunt.clues.firstClue.clue },
          secondClue: { clue: team.treasureHunt.clues.secondClue.clue },
          thirdClue: { clue: team.treasureHunt.clues.thirdClue.clue },
          finalClue: { clue: team.treasureHunt.clues.finalClue.clue },
        } : undefined,
        isAttended: team.isAttended,
        hasScannedWinnerQr: team.treasureHunt?.hasScannedWinnerQr || false,
        winnerScanTime: team.treasureHunt?.winnerScanTime || null
      };
    });

    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}