import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";
import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";
import JSZip from "jszip";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
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

    // Get the clue pair
    const cluePair = await prisma.clues.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        firstClue: true,
        secondClue: true,
        thirdClue: true,
        finalClue: true,
      },
    });

    if (!cluePair) {
      return NextResponse.json({ error: "Clue pair not found" }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();
    const folder = zip.folder(`clue-pair-${cluePair.id}`);
    
    if (!folder) {
      throw new Error("Failed to create zip folder");
    }

    // Generate QR codes and add to ZIP
    const clues = [
      { qrCode: cluePair.firstClue.qrCode, clue: cluePair.firstClue.clue, name: "first-clue" },
      { qrCode: cluePair.secondClue.qrCode, clue: cluePair.secondClue.clue, name: "second-clue" },
      { qrCode: cluePair.thirdClue.qrCode, clue: cluePair.thirdClue.clue, name: "third-clue" },
      { qrCode: cluePair.finalClue.qrCode, clue: cluePair.finalClue.clue, name: "final-clue" }
    ];

    // Generate QR codes in parallel
    await Promise.all(clues.map(async ({ qrCode, name }) => {
      const qrBuffer = await QRCode.toBuffer(qrCode, {
        errorCorrectionLevel: 'H',
        width: 500,
        margin: 1
      });
      folder.file(`${name}.png`, qrBuffer);
    }));

    // Add text file with clue contents
    const clueText = clues
      .map(({ name, clue }, index) => `${index + 1}. ${name}: ${clue}`)
      .join('\n\n');
    folder.file('clues.txt', clueText);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename=clue-pair-${cluePair.id}-qrcodes.zip`);

    return new Response(zipBuffer, {
      headers: headers,
    });

  } catch (error) {
    console.error("Error generating QR codes:", error);
    return NextResponse.json(
      { error: "Failed to generate QR codes" },
      { status: 500 }
    );
  }
}