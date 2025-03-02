import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/config/aws";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const eventId = parseInt(params.id);

    const eventData: any = {
      name: formData.get("name"),
      eventName: formData.get("eventName"),
      description: formData.get("description"),
      venue: formData.get("venue"),
      date: new Date(formData.get("date") as string),
      time: formData.get("time"),
      eventType: formData.get("eventType"),
      participationType: formData.get("participationType"),
      prizePool: parseInt(formData.get("prizePool") as string),
    };

    // Handle image upload if provided
    const imageFile = formData.get("image") as File;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `events/${eventId}/${imageFile.name}`;
      const imageUrl = await uploadFile(buffer, fileName, imageFile.type);
      eventData.imageUrl = imageUrl;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: eventData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}