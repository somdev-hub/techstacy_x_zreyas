import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
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

    // Delete the clue
    await prisma.clues.delete({
      where: { id: parseInt(params.id) }
    });

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
  { params }: { params: { id: string } }
) {
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

    const { firstClue, secondClue, thirdClue, finalClue } = await req.json();

    const clues = await prisma.clues.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        firstClue: true,
        secondClue: true,
        thirdClue: true,
        finalClue: true,
      }
    });

    if (!clues) {
      return NextResponse.json({ error: "Clues not found" }, { status: 404 });
    }

    // Update each clue object
    await Promise.all([
      prisma.clueObject.update({
        where: { id: clues.firstClueId },
        data: { clue: firstClue }
      }),
      prisma.clueObject.update({
        where: { id: clues.secondClueId },
        data: { clue: secondClue }
      }),
      prisma.clueObject.update({
        where: { id: clues.thirdClueId },
        data: { clue: thirdClue }
      }),
      prisma.clueObject.update({
        where: { id: clues.finalClueId },
        data: { clue: finalClue }
      })
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