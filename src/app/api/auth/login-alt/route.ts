import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/schemas";

const prisma = new PrismaClient();

// Hardcoded secret for debugging only
const FALLBACK_SECRET =
  "hardcoded_secret_for_debugging_only_do_not_use_in_production";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = result.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Basic payload with minimal data
    const simplePayload = {
      sub: user.id.toString() // Just use subject with user ID
    };

    console.log("Using simple payload:", simplePayload);

    // Get secret from env or use fallback
    const secret = process.env.JWT_ACCESS_SECRET || FALLBACK_SECRET;
    console.log("Secret is available:", !!secret);

    try {
      // Very basic JWT generation
      const token = jwt.sign(simplePayload, secret);
      console.log("Token generated successfully");

      // Set a simple cookie
      const cookieStore = await cookies();
      cookieStore.set({
        name: "authToken",
        value: token,
        httpOnly: true,
        path: "/"
      });

      // Return minimal response
      return NextResponse.json({
        success: true,
        userId: user.id,
        role: user.role
      });
    } catch (jwtError) {
      console.error("JWT Error:", jwtError);

      // Detailed error information
      const errorInfo = {
        message:
          jwtError instanceof Error ? jwtError.message : String(jwtError),
        name: jwtError instanceof Error ? jwtError.name : "Unknown",
        code:
          jwtError instanceof Error && "code" in jwtError
            ? (jwtError as any).code
            : "NO_CODE",
        stack: jwtError instanceof Error ? jwtError.stack?.split("\n") : []
      };

      return NextResponse.json(
        {
          error: "Authentication failed",
          errorInfo
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);

    return NextResponse.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
