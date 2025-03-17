import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await verifyAccessToken(token);
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get events managed by this admin
    const eventIds = await prisma.eventHead.findMany({
      where: {
        userId: parseInt(decoded.userId),
      },
      select: {
        eventId: true,
      },
    });

    // Get attendance records for these events
    const attendance = await prisma.eventAttendance.findMany({
      where: {
        eventId: {
          in: eventIds.map((event) => event.eventId),
        },
      },
      include: {
        event: {
          select: {
            name: true,
            eventName: true,
            participationType: true,
          },
        },
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

    // For each attendance record, get team details if applicable
    const attendanceWithTeams = await Promise.all(
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
                    sic: true,
                  },
                },
              },
            },
          },
        });

        let teamDetails = null;
        if (participant) {
          const members = participant.otherParticipants.map((member) => ({
            id: member.id.toString(),
            name: member.user.name,
            year: member.user.year,
            imageUrl: member.user.imageUrl,
            sic: member.user.sic,
            isConfirmed: member.isConfirmed
          }));

          teamDetails = {
            leader: {
              id: participant.id.toString(),
              name: record.user.name,
              year: record.user.year,
              imageUrl: record.user.imageUrl,
              sic: record.user.sic,
              isConfirmed: true // Leader is always confirmed
            },
            members,
          };
        }

        return {
          ...record,
          teamDetails,
        };
      })
    );

    return NextResponse.json(attendanceWithTeams);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
