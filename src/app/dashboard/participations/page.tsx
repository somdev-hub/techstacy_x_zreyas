"use client";
import { QRCard } from "@/components/QRCard";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Events, ParticipationType, EventType } from "@prisma/client";

interface TeamMember {
  id: number;
  name: string;
  imageUrl: string | null;
  sic: string;
  isMainParticipant: boolean;
  isConfirmed: boolean;
  isAttended: boolean;
}

interface RegisteredEvent {
  id: number;
  name: string;
  date: string;
  time: string;
  description: string;
  imageUrl: string;
  eventName: Events;
  participationType: ParticipationType;
  eventType: EventType;
  registrationFee: number;
  prizePool: number;
  qrCode: string;

  teammates?: TeamMember[];
}

const Purchases = () => {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        // console.log("Fetching registered events...");
        const response = await fetch("/api/events/user-events", {
          credentials: "include",
        });

        const data = await response.json();
        console.log("Fetched data:", data);
        
        console.log("Response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch events:", data);
          throw new Error(data.error || "Failed to fetch events");
        }

        console.log("Fetched events:", data);
        setRegisteredEvents(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load registered events"
        );
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load registered events"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegisteredEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-8 my-2 mr-2 rounded-2xl">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-700 rounded-lg hover:bg-neutral-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const culturalEvents = registeredEvents.filter(
    (event) => event.eventType === "CULTURAL"
  );
  const nonCulturalEvents = registeredEvents.filter(
    (event) => event.eventType !== "CULTURAL"
  );

  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-4 md:px-8 my-2 mr-2 rounded-2xl">
      {nonCulturalEvents.length > 0 && (
        <>
          <div className="mb-8">
            <h1 className="text-[1.5rem] font-[700]">My Events</h1>
            <p className="text-[1.25rem]">
              View your registered events and QR codes
            </p>
          </div>
          <div className="mt-8 w-full mb-12">
            <div className="flex gap-8">
              <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
                <QRCard cardData={nonCulturalEvents} />
              </div>
            </div>
          </div>
        </>
      )}

      {culturalEvents.length > 0 && (
        <>
          <div className="mb-8">
            <h1 className="text-[1.5rem] font-[700]">My Cultural Events</h1>
            <p className="text-[1.25rem]">
              View your registered cultural events
            </p>
          </div>
          <div className="mt-8 w-full">
            <div className="flex gap-8">
              <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
                <QRCard cardData={culturalEvents} />
              </div>
            </div>
          </div>
        </>
      )}

      {registeredEvents.length === 0 && (
        <div className="text-center py-8 text-neutral-400">
          You haven&apos;t registered for any events yet.
        </div>
      )}
    </div>
  );
};

export default Purchases;
