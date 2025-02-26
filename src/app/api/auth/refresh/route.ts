import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get refresh token from cookies
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
      // Clear invalid cookies
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");

      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Check if the refresh token exists in the database
    const tokenInDb = await prisma.refreshToken.findFirst({
      where: { token: refreshToken }
    });

    if (!tokenInDb) {
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");

      return NextResponse.json(
        { error: "Refresh token not found or revoked" },
        { status: 401 }
      );
    }

    // If valid, generate a new access token
    const newAccessToken = await generateAccessToken({
      userId: payload.userId,
      email: payload.email
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
