import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to generate a random QR code string
const generateRandomQRString = () => {
  return crypto.randomBytes(32).toString('hex');
};

export async function GET(request: Request) {
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

    // Get the current winner clue
    const winnerClue = await prisma.winnerClue.findFirst();

    if (!winnerClue) {
      return NextResponse.json(null);
    }

    return NextResponse.json(winnerClue);
  } catch (error) {
    console.error("Error fetching winner clue:", error);
    return NextResponse.json(
      { error: "Failed to fetch winner clue" },
      { status: 500 }
    );
  }
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

    const { clue } = await request.json();
    
    if (!clue) {
      return NextResponse.json({ error: "Clue text is required" }, { status: 400 });
    }

    // Delete any existing winner clue
    await prisma.winnerClue.deleteMany();

    // Create new winner clue with random QR code
    const winnerClue = await prisma.winnerClue.create({
      data: {
        clue,
        qrCode: generateRandomQRString()
      }
    });

    return NextResponse.json(winnerClue);
  } catch (error) {
    console.error("Error creating winner clue:", error);
    return NextResponse.json(
      { error: "Failed to create winner clue" },
      { status: 500 }
    );
  }
}