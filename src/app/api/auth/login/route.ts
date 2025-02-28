import { loginSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  createAccessToken,
  createRefreshToken,
  TokenPayload,
} from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // console.log(body);

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find the user by email with role information
    const user = await prisma.user.findUnique({
      where: { email },
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

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    try {
      // Create token payload with required fields
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

      // console.log(accessToken, refreshToken);

      if (!accessToken || !refreshToken) {
        throw new Error("Failed to generate tokens");
      }

      // Store refresh token in database
      try {
        // console.log(typeof refreshToken);

        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
          },
        });
      } catch (error) {
        // console.log(user.id);
        console.log(error instanceof Error ? error.message : "Unknown error");

        // console.log("hello world");
      }

      // Determine redirect URL based on role
      let redirectUrl = "/dashboard/home";
      switch (user.role) {
        case "SUPERADMIN":
          redirectUrl = "/super-admin/home";
          break;
        case "ADMIN":
          redirectUrl = "/admin/home";
          break;
      }

      const { password: _, ...userWithoutPassword } = user;

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
        maxAge: 15 * 60, // 15 minutes
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
        maxAge: 15 * 60, // 15 minutes
        path: "/",
      });

      return response;
    } catch (error) {
      console.error("Token generation error:", error);
      return NextResponse.json(
        {
          error: "Authentication failed",
          details:
            error instanceof Error
              ? error.message
              : "Unknown error during token generation",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          error instanceof Error ? error.message : "Unknown error during login",
      },
      { status: 500 }
    );
  }
}
