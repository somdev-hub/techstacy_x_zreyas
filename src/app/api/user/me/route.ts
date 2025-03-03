import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

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
      }

      // Get user data including role
      const user = await prisma.user.findUnique({
        where: { id: parseInt(decoded.userId) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          college: true,
          year: true,
          imageUrl: true,
          sic: true,
          phone: true,
          eventParticipation: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify role matches between token and database
      if (user.role !== decoded.role) {
        return NextResponse.json({ error: "Role mismatch" }, { status: 401 });
      }

      return NextResponse.json(user);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in /api/user/me:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
