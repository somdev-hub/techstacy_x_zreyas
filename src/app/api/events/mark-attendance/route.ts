import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { qrCode } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!qrCode) {
      return NextResponse.json({ error: "QR code is required" }, { status: 400 });
    }

    try {
      const decoded = await verifyAccessToken(token);
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 }
        );
      }

      // Find the participant by QR code
      const participant = await prisma.eventParticipant.findFirst({
        where: { qrCode },
        include: {
          user: true,
          event: true,
          otherParticipants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!participant) {
        return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
      }

      // Check if the admin is an event head for this event
      const isEventHead = await prisma.eventHead.findFirst({
        where: {
          userId: parseInt(decoded.userId),
          eventId: participant.eventId,
        },
      });

      if (!isEventHead) {
        return NextResponse.json(
          { error: "You are not authorized to mark attendance for this event" },
          { status: 403 }
        );
      }

      // Check if attendance is already marked for this participant
      if (participant.isAttended) {
        return NextResponse.json(
          { error: "Attendance already marked for this participant" },
          { status: 400 }
        );
      }

      // Create attendance record and update participant status
      await prisma.$transaction([
        prisma.eventAttendance.create({
          data: {
            eventId: participant.eventId,
            userId: participant.userId,
          },
        }),
        prisma.eventParticipant.update({
          where: { id: participant.id },
          data: { 
            isAttended: true,
            isConfirmed: true  // Set confirmation when attendance is marked
          },
        }),
      ]);

      // For team events, check if all team members have marked attendance
      const isTeamEvent = participant.otherParticipants.length > 0;
      let teamStatus = null;
      
      if (isTeamEvent) {
        const allTeamParticipants = [
          participant,
          ...participant.otherParticipants,
        ];
        const attendedCount = allTeamParticipants.filter(
          (p) => p.isAttended
        ).length;
        const totalMembers = allTeamParticipants.length;
        
        teamStatus = {
          attendedCount,
          totalMembers,
          isFullyAttended: attendedCount === totalMembers,
          isPartiallyAttended: attendedCount > 0 && attendedCount < totalMembers,
        };
      }

      // Fetch updated participant data with team status
      const updatedParticipant = await prisma.eventParticipant.findFirst({
        where: { id: participant.id },
        include: {
          user: true,
          event: true,
          otherParticipants: {
            include: {
              user: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Attendance marked successfully",
        participant: {
          name: participant.user.name,
          event: participant.event.name,
        },
        teamStatus,
        updatedParticipant,
      });
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
