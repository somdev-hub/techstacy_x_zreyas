import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get refresh token to remove from db
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    
    if (refreshToken) {
      // Delete the refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Create response
    const response = NextResponse.json({
      message: "Logged out successfully"
    });

    // Clear cookies with the same attributes they were set with
    response.cookies.set({
      name: "accessToken",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/"
    });

    response.cookies.set({
      name: "refreshToken",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
