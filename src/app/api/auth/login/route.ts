import { loginSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from 'crypto';
import { createAccessToken, createRefreshToken, TokenPayload } from "@/lib/jose-auth";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const prisma = new PrismaClient();

// Constants for token expiry and security
const ACCESS_TOKEN_EXPIRY = 12 * 60 * 60; // 12 hours
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 60; // 1 hour in seconds

// Initialize Redis and rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(MAX_LOGIN_ATTEMPTS, "1 m"),
  analytics: true,
  prefix: "login_ratelimit",
});

// Cookie security options
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Check if IP is locked out
    const isLocked = await redis.get(`lockout:${ip}`);
    if (isLocked) {
      return NextResponse.json(
        { error: "Account temporarily locked. Please try again later." },
        { status: 429 }
      );
    }

    // Apply rate limiting
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      // Lock the IP if max attempts reached
      await redis.set(`lockout:${ip}`, "locked", {
        ex: LOCKOUT_DURATION,
      });

      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find user with minimal required data
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password with constant-time comparison
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Clear any lockouts on successful login
    await redis.del(`lockout:${ip}`);

    try {
      const tokenPayload: TokenPayload = {
        userId: String(user.id),
        email: user.email,
        role: user.role,
      };

      // Generate new tokens
      const [accessToken, refreshToken] = await Promise.all([
        createAccessToken(tokenPayload),
        createRefreshToken(tokenPayload),
      ]);

      if (!accessToken || !refreshToken) {
        throw new Error("Token generation failed");
      }

      // Create hash of refresh token
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Handle refresh tokens in transaction
      await prisma.$transaction(async (tx) => {
        // Clean up old tokens
        await tx.refreshToken.deleteMany({
          where: {
            OR: [{ userId: user.id }, { expiresAt: { lt: new Date() } }],
          },
        });

        // Create new refresh token
        await tx.refreshToken.create({
          data: {
            token: refreshToken,
            tokenHash: tokenHash,
            userId: user.id,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
          },
        });
      });

      const redirectUrl = (() => {
        switch (user.role) {
          case "SUPERADMIN":
            return "/super-admin/home";
          case "ADMIN":
            return "/admin/home";
          default:
            return "/dashboard/home";
        }
      })();

      const { password: _, ...userWithoutPassword } = user;

      const response = NextResponse.json(
        {
          message: "Login successful",
          user: userWithoutPassword,
          redirect: redirectUrl,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );

      // Set secure cookies
      response.cookies.set("accessToken", accessToken, {
        ...getCookieOptions(ACCESS_TOKEN_EXPIRY),
      });

      response.cookies.set("refreshToken", refreshToken, {
        ...getCookieOptions(REFRESH_TOKEN_EXPIRY),
      });

      return response;
    } catch (error) {
      console.log(error instanceof Error ? error.message : "Token generation error");
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log(error instanceof Error ? error.message : "Login error:");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
