import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("accessToken")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const decoded = await verifyAccessToken(token);

      // Verify decoded token has all required fields and is super admin
      if (!decoded.userId || !decoded.email || !decoded.role || decoded.role !== "SUPERADMIN") {
        return NextResponse.json(
          { error: "Unauthorized access" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get attendance records for all events
    const attendance = await prisma.eventAttendance.findMany({
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