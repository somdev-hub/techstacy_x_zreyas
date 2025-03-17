import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/schemas";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import crypto from "crypto";
import {
  createAccessToken,
  createRefreshToken,
  TokenPayload,
} from "@/lib/jose-auth";

const prisma = new PrismaClient();

// Constants for token expiry
const ACCESS_TOKEN_EXPIRY = 12 * 60 * 60; // 12 hours
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body using zod
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    const existingUserWithSic = await prisma.user.findUnique({
      where: { sic: validatedData.sic },
    });
    const existingUserWithPhone = await prisma.user.findUnique({
      where: { phone: validatedData.phone },
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
    if (existingUserWithSic) {
      return NextResponse.json(
        { error: "A user with this SIC already exists" },
        { status: 409 }
      );
    }
    if (existingUserWithPhone) {
      return NextResponse.json(
        { error: "A user with this phone number already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        year: validatedData.year,
        sic: validatedData.sic,
        phone: validatedData.phone,
        college: "Silicon Institute of Technology, Sambalpur",
        password: hashedPassword,
      },
    });

    const tokenPayload: TokenPayload = {
      userId: String(user.id), // Ensure userId is a string
      email: user.email,
      role: user.role,
    };

    // console.log("Creating tokens with payload:", tokenPayload);

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(tokenPayload),
      createRefreshToken(tokenPayload),
    ]);

    // Store refresh token in database
    try {
      // Create hash of refresh token
      const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

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
    } catch (error) {
      console.error(
        "Refresh token creation error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }

    const { password: _, ...userWithoutPassword } = user;

    let redirectUrl = "/dashboard/home";
    switch (user.role) {
      case "SUPERADMIN":
        redirectUrl = "/super-admin/home";
        break;
      case "ADMIN":
        redirectUrl = "/admin/home";
        break;
    }
    const response = NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      redirect: redirectUrl,
    });

    // Set cookies
    response.cookies.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: ACCESS_TOKEN_EXPIRY, // 12 hours
      path: "/",
    });

    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    response.cookies.set({
      name: "userId",
      value: String(user.id),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: ACCESS_TOKEN_EXPIRY, // 12 hours
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Validation failed", details: errorMessages },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong during signup" },
      { status: 500 }
    );
  }
}
