import {
  PrismaClient,
  Events,
  EventType,
  ParticipationType,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/config/aws";

const prisma = new PrismaClient();

// Update event
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const eventName = formData.get("eventName") as Events;
    const prizePool = formData.get("prizePool") as string;
    const registrationFee = formData.get("registrationFee") as string;
    const description = formData.get("description") as string;
    const venue = formData.get("venue") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const eventType = formData.get("eventType") as EventType;
    const participationType = formData.get(
      "participationType"
    ) as ParticipationType;
    const partialRegistration = formData.get("partialRegistration") === "true";
    const image = formData.get("image");

    // Validate required fields
    if (
      !name ||
      !description ||
      !date ||
      !time ||
      !eventType ||
      !participationType ||
      !eventName ||
      !prizePool ||
      !registrationFee ||
      !venue
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get existing event
    const existingEvent = await prisma.event.findUnique({
      where: { id: parseInt((await params).id) },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Handle image upload if new image provided and it's a valid File object
    let imageUrl = existingEvent.imageUrl;
    if (image instanceof File) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const fileName = `events/${Date.now()}-${image.name}`;
      imageUrl = await uploadFile(buffer, fileName, image.type);
    }

    // Update event
    try {
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt((await params).id) },
        data: {
          name,
          description,
          date: new Date(date),
          time,
          eventType,
          participationType,
          eventName,
          prizePool: parseInt(prizePool),
          registrationFee: parseInt(registrationFee),
          venue,
          imageUrl,
          partialRegistration,
        },
      });
      return NextResponse.json(updatedEvent);
    } catch (error) {
      console.log(
        error instanceof Error ? error.message : "Error updating event:",
        error
      );
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log(
      error instanceof Error ? error.message : "Error updating event:",
      error
    );
    return NextResponse.json(
      { error: "Failed to update event" },
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
