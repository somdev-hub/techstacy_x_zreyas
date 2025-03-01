import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { uploadFile } from "@/config/aws";
import { EventType, Events, ParticipationType } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const eventName = formData.get("eventName") as Events;
    const prizePool = formData.get("prizePool") as string;
    const description = formData.get("description") as string;
    const venue = formData.get("venue") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const eventType = formData.get("eventType") as EventType;
    const participationType = formData.get(
      "participationType"
    ) as ParticipationType;
    const image = formData.get("image") as File;

    if (
      !name ||
      !description ||
      !date ||
      !time ||
      !eventType ||
      !participationType ||
      !eventName ||
      !prizePool ||
      !venue ||
      !image
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { eventName },
    });

    if (existingEvent) {
      return NextResponse.json(
        { error: "An event with this name already exists" },
        { status: 409 }
      );
    }

    // Handle image upload
    const buffer = Buffer.from(await image.arrayBuffer());
    const fileName = `events/${Date.now()}-${image.name}`;
    const imageUrl = await uploadFile(buffer, fileName, image.type);

    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        time,
        eventType,
        participationType,
        eventName,
        prizePool: parseInt(prizePool),
        venue,
        imageUrl,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
