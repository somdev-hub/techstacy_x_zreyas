import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

    if (cluePairs.length === 0) {
      throw new Error("No clue pairs available");
    }

    // Calculate the optimal distribution
    const teamsPerClueSet = Math.ceil(teams.length / cluePairs.length);
    
    // Create an array with repeated clue pairs to match team count
    let allClueAssignments: { clueId: number }[] = [];
    cluePairs.forEach(pair => {
      // Add each clue pair the required number of times
      for (let i = 0; i < teamsPerClueSet; i++) {
        allClueAssignments.push({ clueId: pair.id });
      }
    });

    // Trim excess assignments if any
    allClueAssignments = allClueAssignments.slice(0, teams.length);

    // Shuffle the assignments
    const shuffledAssignments = shuffleArray([...allClueAssignments]);

    // Create treasure hunt entries for each team with their randomly assigned clue pair
    const updates = teams.map(async (team, index) => {
      // Create treasure hunt entry for the team
      await prisma.treasureHunt.create({
        data: {
          eventParticipationId: team.id,
          cluesId: shuffledAssignments[index].clueId,
        }
      });
    });

    await Promise.all(updates);

    return NextResponse.json({
      message: "Hunt started successfully",
      teamsAssigned: teams.length,
      clueSetCount: cluePairs.length,
      teamsPerClueSet
    });

  } catch (error) {
    console.error("Error starting hunt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start hunt" },
      { status: 500 }
    );
  }
}
