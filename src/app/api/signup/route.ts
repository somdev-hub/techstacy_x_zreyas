import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/schemas";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { ZodError } from "zod";

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

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

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

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Signup successful",
      user: userWithoutPassword
    });
  } catch (error) {
    if (error instanceof ZodError) {
      // Handle validation errors
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
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
