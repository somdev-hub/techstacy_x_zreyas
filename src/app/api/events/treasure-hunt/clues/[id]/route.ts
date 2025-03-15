import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Delete the clue and related records
    try {
      const clueId = parseInt((await params).id);
      if (isNaN(clueId)) {
        return NextResponse.json({ error: "Invalid clue ID" }, { status: 400 });
      }

      // First check if the clue exists
      const clue = await prisma.clues.findUnique({
        where: { id: clueId },
        include: {
          firstClue: true,
          secondClue: true,
          thirdClue: true,
          finalClue: true,
        }
      });

      if (!clue) {
        return NextResponse.json({ error: "Clue not found" }, { status: 404 });
      }

      const clueObjectIds = [
        clue.firstClueId,
        clue.secondClueId,
        clue.thirdClueId,
        clue.finalClueId
      ].filter(id => id !== null);

      // First delete the TreasureHunt record that references this clue
      await prisma.treasureHunt.deleteMany({
        where: { cluesId: clueId }
      });

      // Delete ClueScans first since they reference ClueObjects
      if (clueObjectIds.length > 0) {
        await prisma.clueScans.deleteMany({
          where: {
            clueObjectId: {
              in: clueObjectIds
            }
          }
        });
      }

      // Delete the main Clues record
      await prisma.clues.delete({
        where: { id: clueId }
      });

      // Finally delete the ClueObjects
      if (clueObjectIds.length > 0) {
        await prisma.clueObject.deleteMany({
          where: {
            id: {
              in: clueObjectIds
            }
          }
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting clue:", error instanceof Error ? error.message : error);
      return NextResponse.json(
        { error: "Failed to delete clue and related records" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete clue:", error);
    return NextResponse.json(
      { error: "Failed to delete clue" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (
      !decoded.userId ||
      !decoded.email ||
      !decoded.role ||
      decoded.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { firstClue, secondClue, thirdClue, finalClue } = await req.json();

    const clues = await prisma.clues.findUnique({
      where: { id: parseInt((await params).id) },
      include: {
        firstClue: true,
        secondClue: true,
        thirdClue: true,
        finalClue: true,
      },
    });

    if (!clues) {
      return NextResponse.json({ error: "Clues not found" }, { status: 404 });
    }

    // Update each clue object
    await Promise.all([
      prisma.clueObject.update({
        where: { id: clues.firstClueId },
        data: { clue: firstClue },
      }),
      prisma.clueObject.update({
        where: { id: clues.secondClueId },
        data: { clue: secondClue },
      }),
      prisma.clueObject.update({
        where: { id: clues.thirdClueId },
        data: { clue: thirdClue },
      }),
      prisma.clueObject.update({
        where: { id: clues.finalClueId },
        data: { clue: finalClue },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update clues:", error);
    return NextResponse.json(
      { error: "Failed to update clues" },
      { status: 500 }
    );
  }
}
