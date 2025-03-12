import {
  PrismaClient,
  Events,
  EventType,
  ParticipationType,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/config/aws";

const prisma = new PrismaClient();

// Get all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        eventName: true,
        eventType: true,
        participationType: true,
        description: true,
        imageUrl: true,
        date: true,
        time: true,
        venue: true,
        prizePool: true,
        partialRegistration: true,
      },
    });

    const transformedEvents = events.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date.toISOString().split("T")[0],
      time: event.time,
      description: event.description,
      imageUrl: event.imageUrl,
      eventName: event.eventName,
      participationType: event.participationType,
      eventType: event.eventType,
      prizePool: event.prizePool,
      venue: event.venue,
      partialRegistration: event.partialRegistration,
    }));

    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// Create new event
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
    const partialRegistration = formData.get("partialRegistration") === "true";
    const image = formData.get("image") as File;

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
      !venue ||
      !image
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate enum values
    if (!Object.values(Events).includes(eventName as Events)) {
      return NextResponse.json(
        { error: "Invalid event name" },
        { status: 400 }
      );
    }

    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    if (!Object.values(ParticipationType).includes(participationType)) {
      return NextResponse.json(
        { error: "Invalid participation type" },
        { status: 400 }
      );
    }

    // Check for existing event
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

    // Create event
    try {
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
          partialRegistration,
        },
      });
      return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
      console.log(
        error instanceof Error ? error.message : "Failed to create event:"
      );
    }
  } catch (error) {
    console.log(
      error instanceof Error ? error.message : "Failed to create event:"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
