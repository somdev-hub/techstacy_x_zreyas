"use client";
import React, { useEffect, useState } from "react";
import AdminEventCard from "@/components/AdminEventCards";
import { Events, ParticipationType, EventType } from "@prisma/client";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  desc: string;
  image: string;
  key: Events;
  participationType: ParticipationType;
  eventType: EventType;
  registrationFee: number;
  prizePool: number;
  venue: string;
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

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Manage Events</h1>
      <div className="bg-neutral-800 rounded-xl p-4">
        <AdminEventCard cardData={events} />
      </div>
    </div>
  );
};

export default EventsPage;
