import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import crypto from 'crypto';
import { verifyRefreshToken, createAccessToken, createRefreshToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

// Constants for token expiry
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

// Common cookie options for security
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not provided", code: "TOKEN_MISSING" },
        { status: 401 }
      );
    }

    // Create hash of the provided refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Start a transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Lock the refresh token record for update using the hash
      const tokenInDb = await tx.refreshToken.findFirst({
        where: { 
          tokenHash,
          // Add check for token expiry
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              name: true
            }
          }
        }
      });

      if (!tokenInDb) {
        return { error: "Refresh token not found, revoked, or expired", code: "TOKEN_INVALID", status: 401 };
      }

      // Verify refresh token and check if it matches the user
      try {
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload || payload.userId !== String(tokenInDb.user.id)) {
          throw new Error("Invalid token payload");
        }

        // Create new tokens with extended expiry
        const [newAccessToken, newRefreshToken] = await Promise.all([
          createAccessToken({
            userId: String(tokenInDb.user.id),
            email: tokenInDb.user.email,
            role: tokenInDb.user.role
          }),
          createRefreshToken({
            userId: String(tokenInDb.user.id),
            email: tokenInDb.user.email,
            role: tokenInDb.user.role
          })
        ]);

        // Create hash of new refresh token
        const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

        // Delete old refresh token and create new one atomically
        await tx.refreshToken.delete({
          where: { id: tokenInDb.id }
        });

        await tx.refreshToken.create({
          data: {
            token: newRefreshToken,
            tokenHash: newTokenHash,
            userId: tokenInDb.user.id,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000)
          }
        });

        // Clean up expired tokens in background after transaction
        tx.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: new Date()
            }
          }
        }).catch(err => console.error('Error cleaning up expired tokens:', err));

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: {
            id: tokenInDb.user.id,
            email: tokenInDb.user.email,
            role: tokenInDb.user.role,
            name: tokenInDb.user.name
          }
        };
      } catch (error) {
        // If token verification fails, delete the token
        await tx.refreshToken.delete({
          where: { id: tokenInDb.id }
        });
        
        throw error;
      }
    });

    if ('error' in result) {
      const response = NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status }
      );
      // Clear cookies on error
      response.cookies.set("accessToken", "", { ...getCookieOptions(0) });
      response.cookies.set("refreshToken", "", { ...getCookieOptions(0) });
      return response;
    }

    // Set new cookies with enhanced security options
    const response = NextResponse.json({
      message: "Tokens refreshed successfully",
      user: result.user
    });

    response.cookies.set("accessToken", result.accessToken, {
      ...getCookieOptions(ACCESS_TOKEN_EXPIRY)
    });

    response.cookies.set("refreshToken", result.refreshToken, {
      ...getCookieOptions(REFRESH_TOKEN_EXPIRY)
    });

    return response;

  } catch (error) {
    console.error("Token refresh error:", error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error);

    // Clear cookies on any error
    const response = NextResponse.json(
      { error: "Token refresh failed", code: "REFRESH_FAILED" },
      { status: 401 }
    );
    response.cookies.set("accessToken", "", { ...getCookieOptions(0) });
    response.cookies.set("refreshToken", "", { ...getCookieOptions(0) });
    return response;
  }
}
