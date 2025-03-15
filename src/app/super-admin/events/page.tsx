"use client";
import React, { useEffect, useState } from "react";
import AdminEventCard from "@/components/AdminEventCards";
import { Events, ParticipationType, EventType } from "@prisma/client";

interface Event {
  id: number;
  name: string;
  eventName: Events;
  eventType: EventType;
  description: string;
  imageUrl: string;
  date: string; // Will be converted from DateTime
  time: string;
  venue: string;
  participationType: ParticipationType;
  registrationFee: number; // This field is not in the schema
  prizePool: number;
  createdAt: string; // Will be converted from DateTime
  updatedAt: string; // Will be converted from DateTime
  partialRegistration: boolean; // Add partialRegistration field
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        // console.log(data);

        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  const transformedEvents = events.map((event) => ({
    id: event.id,
    title: event.name,
    desc: event.description,
    image: event.imageUrl,
    date: new Date(event.date).toLocaleDateString(),
    time: event.time,
    key: event.eventName,
    participationType: event.participationType,
    eventType: event.eventType,
    registrationFee: event.registrationFee, // This field is not in the schema
    prizePool: event.prizePool,
    venue: event.venue,
    partialRegistration: event.partialRegistration || false, // Include partialRegistration field with default false
  }));

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Manage Events</h1>
      <div className="bg-neutral-800 rounded-xl p-4">
        <AdminEventCard cardData={transformedEvents} />
      </div>
    </div>
  );
};

export default EventsPage;
