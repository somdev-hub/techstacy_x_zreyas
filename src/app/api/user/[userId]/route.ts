import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function GET(
  _: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get the userId from the route parameter
    const { userId } = await params;

    // Verify the user is accessing their own data
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("userId")?.value;

    if (!sessionUserId || sessionUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Convert userId to number as our DB uses numeric IDs
    const id = parseInt(userId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Query the user from the database with specific field selection
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        college: true,
        sic: true,
        year: true,
        role: true,
        imageUrl: true,
        eventParticipation: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude password
      },
    });

    // Return 404 if user not found
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the user data
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  } finally {
    // Close Prisma connection (optional)
    await prisma.$disconnect();
  }
}
