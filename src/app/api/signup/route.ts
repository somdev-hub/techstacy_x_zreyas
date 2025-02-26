import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/schemas";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ZodError } from "zod";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body using zod
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    const existingUserWithSic = await prisma.user.findUnique({
      where: { sic: validatedData.sic }
    });
    const existingUserWithPhone = await prisma.user.findUnique({
      where: { phone: validatedData.phone }
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
        password: hashedPassword
      }
    });

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: user.id.toString(),
      email: user.email
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id.toString(),
      email: user.email
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id
      }
    });

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set({
      name: "accessToken",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60, // 15 minutes
      path: "/"
    });

    cookieStore.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Signup successful",
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message
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
