import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/config/aws";

const prisma = new PrismaClient();

// Update event
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const eventId = parseInt(params.id);

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Build update data from form
    const updateData: any = {};

    // Handle optional text fields
    const textFields = ["name", "description", "venue", "time"];
    textFields.forEach((field) => {
      const value = formData.get(field);
      if (value) updateData[field] = value;
    });

    // Handle optional enum fields
    const enumFields = ["eventName", "eventType", "participationType"];
    enumFields.forEach((field) => {
      const value = formData.get(field);
      if (value) updateData[field] = value;
    });

    // Handle optional numeric fields
    const numericFields = ["prizePool"];
    numericFields.forEach((field) => {
      const value = formData.get(field);
      if (value) updateData[field] = parseInt(value as string);
    });

    // Handle date field
    const date = formData.get("date");
    if (date) {
      updateData.date = new Date(date as string);
    }

    // Handle boolean fields
    const partialRegistration = formData.get("partialRegistration");
    if (partialRegistration !== null) {
      updateData.partialRegistration = partialRegistration === "true";
    }

    // Handle image upload if provided
    const imageFile = formData.get("image") as File;
    if (imageFile?.size > 0) {
      try {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const fileName = `events/${eventId}/${Date.now()}-${imageFile.name}`;
        const imageUrl = await uploadFile(buffer, fileName, imageFile.type);

        if (!imageUrl) {
          throw new Error("Image upload failed");
        }

        updateData.imageUrl = imageUrl;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update event",
      },
      { status: 500 }
    );
  }
}

// Delete event
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const { id } = use(params);
    const eventId = parseInt((await params).id);

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
        eventHeads: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete related records in a transaction
    await prisma.$transaction([
      // Delete event participants
      prisma.eventParticipant.deleteMany({
        where: { eventId },
      }),
      // Delete event heads
      prisma.eventHead.deleteMany({
        where: { eventId },
      }),
      // Delete the event
      prisma.event.delete({
        where: { id: eventId },
      }),
    ]);

    return NextResponse.json({
      message: "Event and related records deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
