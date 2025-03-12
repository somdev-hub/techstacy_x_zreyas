import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jose-auth";
// import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("accessToken")?.value;
    let userId;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const decoded = await verifyAccessToken(token);

      // Verify decoded token has all required fields
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 }
        );
      } else {
        userId = decoded.userId;
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get events where admin is event head
    const eventHeads = await prisma.eventHead.findMany({
      where: { userId: admin.id },
      include: {
        event: true,
      },
    });

    const eventIds = eventHeads.map((eh) => eh.eventId);

    // Get attendance records for these events
    const attendance = await prisma.eventAttendance.findMany({
      where: {
        eventId: {
          in: eventIds,
        },
      },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            sic: true,
            year: true,
            college: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For each attendance record, get the team details
    const attendanceWithTeam = await Promise.all(
      attendance.map(async (record) => {
        const participant = await prisma.eventParticipant.findFirst({
          where: {
            eventId: record.eventId,
            userId: record.userId,
          },
          include: {
            otherParticipants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    year: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        });

        return {
          ...record,
          teamDetails: participant ? {
            leader: {
              id: participant.id.toString(),
              name: record.user.name,
              year: record.user.year,
              imageUrl: record.user.imageUrl,
            },
            members: participant.otherParticipants.map((member) => ({
              id: member.id.toString(),
              name: member.user.name,
              year: member.user.year,
              imageUrl: member.user.imageUrl,
            })),
          } : null,
        };
      })
    );

    return NextResponse.json(attendanceWithTeam);
  } catch (error) {
    console.error("Error fetching event attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch event attendance" },
      { status: 500 }
    );
  }
}
