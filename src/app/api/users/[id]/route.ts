import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Events } from "@prisma/client";
import bcrypt from "bcrypt";
import { uploadFile } from "@/config/aws";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = parseInt(context.params.id);
    
    // Fetch the user with their event participations and event head roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        eventParticipants: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        eventHeads: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                eventName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform the data to match the expected format
    const { password: _, ...userWithoutPassword } = user;
    const transformedUser = {
      ...userWithoutPassword,
      eventParticipation: user.eventParticipants.map((ep) => ({
        eventId: ep.event.id,
        name: ep.event.name,
      })),
      eventHeads: user.eventHeads.map((eh) => ({
        eventId: eh.event.id,
        name: eh.event.name,
        eventName: eh.event.eventName,
      })),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const userId = parseInt(context.params.id);
    const formData = await request.formData();

    // Handle image upload if present
    let imageUrl;
    const image = formData.get('image') as File;
    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const fileName = `users/${userId}-${Date.now()}-${image.name}`;
      imageUrl = await uploadFile(buffer, fileName, image.type);
    }

    // Create update data
    const updateData: any = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      sic: formData.get('sic') as string,
      year: formData.get('year') as string || undefined,
    };

    // Add imageUrl if we have one
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // Handle password if provided
    const password = formData.get('password') as string;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update the user's basic information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Handle managed events if present and user is admin
    const managedEventsJson = formData.get('managedEvents') as string;
    if (managedEventsJson && updatedUser.role === "ADMIN") {
      const managedEvents = JSON.parse(managedEventsJson) as string[];
      
      // Validate that all events are valid enum values
      const validEvents = managedEvents.filter((eventName): eventName is Events => 
        Object.values(Events).includes(eventName as Events)
      );

      // Get all events by their names
      const events = await prisma.event.findMany({
        where: {
          eventName: {
            in: validEvents,
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
                eventName: true,
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
        eventName: eh.event.eventName,
      })),
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
