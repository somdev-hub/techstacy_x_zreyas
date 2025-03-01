import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Role, Events } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const request = await req.json();
  const { name, email, password, phone, sic, year, event } = request;

  if (!name || !email || !password || !phone || !sic || !year || !event) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Check if event exists first
    const eventData = await prisma.event.findFirst({
      where: { eventName: event },
    });

    if (!eventData) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email },
    });
    const existingUserWithSic = await prisma.user.findUnique({
      where: { sic },
    });
    const existingUserWithPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    } else if (existingUserWithSic) {
      return NextResponse.json(
        { error: "A user with this SIC already exists" },
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    } else if (existingUserWithPhone) {
      return NextResponse.json(
        { error: "A user with this phone number already exists" },
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use Prisma transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create the admin user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          sic,
          year,
          role: Role.ADMIN,
          college: "Silicon Institute of Technology, Sambalpur",
        },
      });

      // Create event head association
      await tx.eventHead.create({
        data: {
          userId: newUser.id,
          eventId: eventData.id,
        },
      });

      const { password: _, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    });

    return NextResponse.json(
      { 
        message: "Admin created successfully",
        user: result
      },
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Error creating admin" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
