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

    const { teamId, clueId } = await req.json();

    // Get the team's current progress
    const team = await prisma.eventParticipant.findUnique({
      where: { id: teamId },
      include: {
        treasureHunt: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get or create a clues set for this team
    if (!team.treasureHunt) {
      // First, we need to find or create a Clues record
      const clueObject = await prisma.clueObject.findUnique({
        where: { id: clueId }
      });

      if (!clueObject) {
        return NextResponse.json(
          { error: "Clue not found" },
          { status: 404 }
        );
      }

      // Create a new Clues record with all required clues
      // Note: The schema requires all four clue fields to be present
      const clues = await prisma.clues.create({
        data: {
          firstClueId: clueId,
          secondClueId: clueId, // Initially set all to the same clue
          thirdClueId: clueId,  // These can be updated later
          finalClueId: clueId   // as the team progresses
        }
      });

      // Now create the TreasureHunt record
      await prisma.treasureHunt.create({
        data: {
          eventParticipationId: teamId,
          cluesId: clues.id
        }
      });
    } else {
      // Team already has a treasure hunt entry
      // We need to update the clues based on progress
      const clueObject = await prisma.clueObject.findUnique({
        where: { id: clueId }
      });

      if (!clueObject) {
        return NextResponse.json(
          { error: "Clue not found" },
          { status: 404 }
        );
      }

      // Fetch the current clues record
      const currentClues = await prisma.clues.findUnique({
        where: { id: team.treasureHunt.cluesId }
      });

      if (!currentClues) {
        return NextResponse.json(
          { error: "Clues record not found" },
          { status: 404 }
        );
      }

      // Update the appropriate clue based on current progress
      // This is a simplified logic - you might need to adjust based on your game flow
      let updateData = {};
      
      // Check which clue to update
      if (currentClues.secondClueId === currentClues.firstClueId) {
        updateData = { secondClueId: clueId };
      } else if (currentClues.thirdClueId === currentClues.firstClueId) {
        updateData = { thirdClueId: clueId };
      } else if (currentClues.finalClueId === currentClues.firstClueId) {
        updateData = { finalClueId: clueId };
      } else {
        return NextResponse.json(
          { error: "All clues are already assigned" },
          { status: 400 }
        );
      }

      // Update the clues
      await prisma.clues.update({
        where: { id: currentClues.id },
        data: updateData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning clue:", error);
    return NextResponse.json(
      { error: "Failed to assign clue" },
      { status: 500 }
    );
  }
}