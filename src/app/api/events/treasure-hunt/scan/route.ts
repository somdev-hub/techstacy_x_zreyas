import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
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

    const { qrCode } = await req.json();

    // Find the clue object by QR code
    const clueObject = await prisma.clueObject.findFirst({
      where: { qrCode: qrCode }
    });

    if (!clueObject) {
      return NextResponse.json(
        { error: "Invalid QR code" },
        { status: 400 }
      );
    }

    // Get participant and their assigned clues
    const participant = await prisma.eventParticipant.findFirst({
      where: {
        userId: parseInt(decoded.userId),
        event: {
          eventName: "TREASURE_HUNT"
        }
      },
      include: {
        treasureHunt: {
          include: {
            clues: true
          }
        },
        clueScans: {
          orderBy: {
            scannedAt: 'desc'
          }
        }
      }
    });

    // Check if attendance is marked
    if (!participant?.isAttended) {
      return NextResponse.json(
        { error: "Your attendance must be marked before participating" },
        { status: 403 }
      );
    }

    if (!participant?.treasureHunt) {
      return NextResponse.json(
        { error: "No clues assigned to your team" },
        { status: 400 }
      );
    }

    const assignedClues = participant.treasureHunt.clues;
    const scannedCount = participant.clueScans.length;
    
    // Don't validate first clue as it's automatically revealed
    // Verify this is the correct next clue to scan
    let isCorrectClue = false;
    if (scannedCount === 0 && clueObject.id === assignedClues.secondClueId) isCorrectClue = true;
    else if (scannedCount === 1 && clueObject.id === assignedClues.thirdClueId) isCorrectClue = true;
    else if (scannedCount === 2 && clueObject.id === assignedClues.finalClueId) isCorrectClue = true;

    if (!isCorrectClue) {
      return NextResponse.json({
        error: "This is not the correct clue to scan right now"
      }, { status: 400 });
    }

    // Record the scan
    await prisma.clueScans.create({
      data: {
        clueObjectId: clueObject.id,
        eventParticipationId: participant.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Clue found!",
      clue: clueObject.clue
    });

  } catch (error) {
    console.error("Error processing QR scan:", error);
    return NextResponse.json(
      { error: "Failed to process QR scan" },
      { status: 500 }
    );
  }
}