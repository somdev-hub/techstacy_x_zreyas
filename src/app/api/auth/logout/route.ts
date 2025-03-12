import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Common cookie options for security
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge
});

export async function POST() {
  try {
    // Get refresh token to remove from db
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    
    if (refreshToken) {
      // Start a transaction to handle token cleanup
      await prisma.$transaction(async (tx) => {
        // Delete the specific refresh token
        await tx.refreshToken.deleteMany({
          where: { token: refreshToken }
        });

        // Also cleanup any expired tokens
        await tx.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: new Date()
            }
          }
        });
      });
    }

    // Create response
    const response = NextResponse.json({
      message: "Logged out successfully"
    });

    // Clear cookies with enhanced security options
    response.cookies.set("accessToken", "", { ...getCookieOptions(0) });
    response.cookies.set("refreshToken", "", { ...getCookieOptions(0) });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Still clear cookies even if DB cleanup fails
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    
    response.cookies.set("accessToken", "", { ...getCookieOptions(0) });
    response.cookies.set("refreshToken", "", { ...getCookieOptions(0) });
    
    return response;
  }
}
