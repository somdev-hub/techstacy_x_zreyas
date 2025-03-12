import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { nanoid } from "nanoid";

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

    // Get all clue pairs with their related clue objects
    const cluePairs = await prisma.clues.findMany({
      include: {
        firstClue: true,
        secondClue: true,
        thirdClue: true,
        finalClue: true,
      },
    });

    // Format the response to match the expected structure in the frontend
    const formattedCluePairs = cluePairs.map(pair => ({
      id: pair.id,
      firstClue: {
        clue: pair.firstClue.clue,
        qrCode: pair.firstClue.qrCode,
      },
      secondClue: {
        clue: pair.secondClue.clue,
        qrCode: pair.secondClue.qrCode,
      },
      thirdClue: {
        clue: pair.thirdClue.clue,
        qrCode: pair.thirdClue.qrCode,
      },
      finalClue: {
        clue: pair.finalClue.clue,
        qrCode: pair.finalClue.qrCode,
      },
    }));

    return NextResponse.json(formattedCluePairs);
  } catch (error) {
    console.error("Failed to fetch clues:", error);
    return NextResponse.json(
      { error: "Failed to fetch clues" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await verifyAccessToken(token);
    if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { firstClue, secondClue, thirdClue, finalClue } = await req.json();

    // Create ClueObjects first
    const [first, second, third, final] = await Promise.all([
      prisma.clueObject.create({
        data: {
          clue: firstClue,
          qrCode: nanoid(),
        }
      }),
      prisma.clueObject.create({
        data: {
          clue: secondClue,
          qrCode: nanoid(),
        }
      }),
      prisma.clueObject.create({
        data: {
          clue: thirdClue,
          qrCode: nanoid(),
        }
      }),
      prisma.clueObject.create({
        data: {
          clue: finalClue,
          qrCode: nanoid(),
        }
      })
    ]);

    // Create the Clues record linking all ClueObjects
    const cluePair = await prisma.clues.create({
      data: {
        firstClueId: first.id,
        secondClueId: second.id,
        thirdClueId: third.id,
        finalClueId: final.id,
      },
      include: {
        firstClue: true,
        secondClue: true,
        thirdClue: true,
        finalClue: true,
      }
    });

    // Format response to match frontend expectations
    const formattedCluePair = {
      id: cluePair.id,
      firstClue: {
        clue: cluePair.firstClue.clue,
        qrCode: cluePair.firstClue.qrCode,
      },
      secondClue: {
        clue: cluePair.secondClue.clue,
        qrCode: cluePair.secondClue.qrCode,
      },
      thirdClue: {
        clue: cluePair.thirdClue.clue,
        qrCode: cluePair.thirdClue.qrCode,
      },
      finalClue: {
        clue: cluePair.finalClue.clue,
        qrCode: cluePair.finalClue.qrCode,
      },
    };

    return NextResponse.json(formattedCluePair);
  } catch (error) {
    console.error("Failed to create clue pair:", error);
    return NextResponse.json(
      { error: "Failed to create clue pair" },
      { status: 500 }
    );
  }
}