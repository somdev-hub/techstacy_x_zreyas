import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

const prisma = new PrismaClient();

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

    // Get the winner clue
    const winnerClue = await prisma.winnerClue.findFirst();

    if (!winnerClue) {
      return NextResponse.json({ error: "Winner clue not found" }, { status: 404 });
    }

    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(winnerClue.qrCode, {
      errorCorrectionLevel: 'H',
      width: 500,
      margin: 1
    });

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    headers.set('Content-Disposition', `attachment; filename=winner-clue-qr.png`);

    return new Response(qrBuffer, {
      headers: headers,
    });

  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}