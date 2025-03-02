import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  college: string;
  sic: string;
  year: string;
  imageUrl: string | null;
  role: string;
  eventHeads?: { eventId: number }[];
  eventParticipation?: { eventId: number }[];
  eventParticipants?: { eventId: number }[];
}

async function fetchEventDetails(eventId: number) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, imageUrl: true },
  });
}

export async function GET() {
  try {
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
      orderBy: {
        role: "asc",
      },
    });

    // Get detailed user information for each role
    const usersWithDetails = await Promise.all(
      usersByRole.map(async (group) => ({
        role: group.role,
        count: group._count.id,
        users: await Promise.all(
          (
            await prisma.user.findMany({
              where: {
                role: group.role,
              },
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                college: true,
                sic: true,
                year: true,
                imageUrl: true,
                ...(group.role === "ADMIN"
                  ? {
                      eventHeads: {
                        select: {
                          eventId: true,
                        },
                      },
                    }
                  : {
                      eventParticipation: true,
                      eventParticipants: {
                        select: {
                          eventId: true,
                        },
                      },
                    }),
                role: true,
              },
            })
          ).map(async (user: User) => ({
            ...user,
            ...(group.role === "ADMIN"
              ? {
                  eventHeads: await Promise.all(
                    (user.eventHeads ?? []).map((head) =>
                      fetchEventDetails(head.eventId)
                    )
                  ),
                }
              : {
                  eventParticipants: await Promise.all(
                    (user.eventParticipants ?? []).map((participant) =>
                      fetchEventDetails(participant.eventId)
                    )
                  ),
                }),
          }))
        ),
      }))
    );

    return NextResponse.json(usersWithDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return NextResponse.json(
      { error: "Failed to fetch users by role" },
      { status: 500 }
    );
  }
}
