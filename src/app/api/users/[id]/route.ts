import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const body = await request.json();

    // Create update data without password
    const updateData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      sic: body.sic,
      year: body.year,
      imageUrl: body.imageUrl,
    };

    // If password is provided, hash it and add to update data
    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      Object.assign(updateData, { password: hashedPassword });
    }

    // Update the user's basic information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // If managed events are provided and user is an admin, update their event assignments
    if (body.managedEvents && updatedUser.role === "ADMIN") {
      // First, get all events by their names
      const events = await prisma.event.findMany({
        where: {
          eventName: {
            in: body.managedEvents,
          },
        },
        select: {
          id: true,
        },
      });

      // Delete all existing event head assignments for this user
      await prisma.eventHead.deleteMany({
        where: {
          userId: userId,
        },
      });

      // Create new event head assignments
      if (events.length > 0) {
        await prisma.eventHead.createMany({
          data: events.map((event) => ({
            userId: userId,
            eventId: event.id,
          })),
        });
      }
    }

    // Fetch the updated user with their event assignments
    const finalUserData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        eventHeads: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!finalUserData) {
      throw new Error("Failed to fetch updated user data");
    }

    // Transform the data to match the expected format
    const { password: _, ...userWithoutPassword } = finalUserData;
    const transformedUser = {
      ...userWithoutPassword,
      eventHeads: finalUserData.eventHeads.map((eh) => ({
        eventId: eh.event.id,
        name: eh.event.name,
      })),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
