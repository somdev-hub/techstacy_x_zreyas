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
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update the event status to running
    await prisma.event.update({
      where: { eventName: "TREASURE_HUNT" },
      data: { partialRegistration: true }  // Using partialRegistration as hunt status flag
    });

    // Get all teams with attendance marked
    const teams = await prisma.eventParticipant.findMany({
      where: {
        event: { eventName: "TREASURE_HUNT" },
        isAttended: true,
        teamLeader: true
      }
    });

    // Get available clue pairs
    const cluePairs = await prisma.clues.findMany();

    if (cluePairs.length < teams.length) {
      throw new Error("Not enough clue pairs for all teams");
    }

    // Assign clue pairs to teams randomly
    const assignedPairs = new Set();
    const updates = teams.map(async (team) => {
      let randomPairIndex;
      do {
        randomPairIndex = Math.floor(Math.random() * cluePairs.length);
      } while (assignedPairs.has(randomPairIndex));
      
      assignedPairs.add(randomPairIndex);
      const selectedPair = cluePairs[randomPairIndex];

      // Create treasure hunt entry for the team
      await prisma.treasureHunt.create({
        data: {
          eventParticipationId: team.id,
          cluesId: selectedPair.id,
        }
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ message: "Hunt started successfully" });

  } catch (error) {
    console.error("Error starting hunt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start hunt" },
      { status: 500 }
    );
  }
}
