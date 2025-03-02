import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc'
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
      }
    });

    // Transform the data to match the expected format
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.name,
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      desc: event.description,
      image: event.imageUrl,
      key: event.eventName,
      participationType: event.participationType,
      eventType: event.eventType,
      registrationFee: 0, // Add this if you have it in your schema
      prizePool: event.prizePool,
      venue: event.venue
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
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

    // Handle image upload
    const imageFile = formData.get("image") as File;
    if (imageFile) {
      const blob = await put(`events/${Date.now()}-${imageFile.name}`, imageFile, {
        access: 'public',
      });
      eventData.imageUrl = blob.url;
    }

    const event = await prisma.event.create({
      data: eventData
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}