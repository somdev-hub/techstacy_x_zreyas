import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyRefreshToken, createAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not provided" },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload) {
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Check if the refresh token exists in the database
    const tokenInDb = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            role: true
          }
        }
      }
    });

    if (!tokenInDb) {
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return NextResponse.json(
        { error: "Refresh token not found or revoked" },
        { status: 401 }
      );
    }

    // Create new access token with complete payload including role
    const newAccessToken = await createAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: tokenInDb.user.role // Include role from database
    });

    // Set the new access token in cookies
    cookieStore.set({
      name: "accessToken",
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minutes
      path: "/"
    });

    return NextResponse.json({
      message: "Token refreshed successfully"
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
