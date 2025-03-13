import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { qrCode } = await request.json();

    // Find the winner clue
    const winnerClue = await prisma.winnerClue.findFirst({
      where: { qrCode },
    });

    if (!winnerClue) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 400 });
    }

    // Get the participant's treasure hunt data
    const participant = await prisma.eventParticipant.findFirst({
      where: {
        userId: parseInt(decoded.userId),
        event: { eventName: "TREASURE_HUNT" },
      },
      include: {
        treasureHunt: true,
        user: true,
        otherParticipants: {
          include: { user: true },
        },
        clueScans: {
          orderBy: {
            scannedAt: 'desc'
          },
          include: {
            clueObject: true
          }
        }
      },
    });

    if (!participant?.treasureHunt) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Check if this team has already scanned
    if (participant.treasureHunt.hasScannedWinnerQr) {
      return NextResponse.json({
        message: "Your team has already scanned the winner QR code",
        isWinner: false,
      });
    }

    // Verify that team has scanned all regular clues before allowing the winner QR
    // Get the assigned clues for this team
    const assignedClues = await prisma.treasureHunt.findUnique({
      where: { id: participant.treasureHunt.id },
      include: { clues: true }
    });

    if (!assignedClues) {
      return NextResponse.json({ 
        error: "Could not find assigned clues for your team" 
      }, { status: 400 });
    }
    
    // Count scanned clues - should be 3 (first clue is auto-revealed, not scanned)
    if (participant.clueScans.length < 3) {
      return NextResponse.json({
        error: "You need to find all clues before scanning the winner QR",
        cluesScanned: participant.clueScans.length,
        requiredClues: 3
      }, { status: 400 });
    }
    
    // Verify that final clue was scanned (clue 4)
    const finalClueScanned = participant.clueScans.some(
      scan => scan.clueObjectId === assignedClues.clues.finalClueId
    );
    
    if (!finalClueScanned) {
      return NextResponse.json({
        error: "You need to find the final clue before scanning the winner QR"
      }, { status: 400 });
    }

    // Check if there's already a winner
    const existingWinner = await prisma.treasureHunt.findFirst({
      where: { hasScannedWinnerQr: true },
      orderBy: { winnerScanTime: "asc" },
      include: {
        eventParticipant: {
          include: {
            user: true,
            otherParticipants: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Update the team's record
    await prisma.treasureHunt.update({
      where: { id: participant.treasureHunt.id },
      data: {
        hasScannedWinnerQr: true,
        winnerScanTime: new Date(),
      },
    });

    // Get all participants to notify
    const allParticipants = await prisma.eventParticipant.findMany({
      where: { event: { eventName: "TREASURE_HUNT" } },
      include: { user: true },
    });

    // If this is the first team to scan
    if (!existingWinner) {
      // Queue notifications for all participants
      const notifications = allParticipants.map((p) => ({
        userId: p.userId,
        title: "Treasure Hunt Winner!",
        message: `Team ${participant.user.name} has won the treasure hunt! Congratulations to the winners!`,
        sent: false,
      }));

      await prisma.notificationQueue.createMany({
        data: notifications,
      });

      return NextResponse.json({
        message:
          "Congratulations! Your team is the first to find the final clue!",
        isWinner: true,
      });
    }

    // If not the winner, notify just this team
    await prisma.notificationQueue.create({
      data: {
        userId: participant.userId,
        title: "Almost there!",
        message: `Team ${existingWinner.eventParticipant.user.name} already found the final clue and won the hunt. Keep trying for next time!`,
        sent: false,
      },
    });

    return NextResponse.json({
      message: `Another team has already won. The winner was team ${existingWinner.eventParticipant.user.name}`,
      isWinner: false,
      winnerTeam: existingWinner.eventParticipant.user.name,
      winTime: existingWinner.winnerScanTime,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ 
      error: "Failed to process winner QR code" 
    }, { status: 500 });
  }
}
