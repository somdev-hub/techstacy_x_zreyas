"use client";
import React, { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCards";
import { ThreeDCard } from "@/components/ThreeDCard";
import { Events, ParticipationType, EventType } from "@prisma/client";
import { toast } from "sonner";

const Home = () => {
  const [technicalEventsData, setTechnicalEventsData] = useState([]);
  const [nonTechnicalEventsData, setNonTechnicalEventsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  const tshirtCard = {
    title: "Get your event t-shirt",
    description:
      "Order your event t-shirt now and get it delivered to your doorstep.",
    src: "/assets/tshirt.png",
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          toast.error("Failed to fetch events");
          throw new Error("Failed to fetch events");
        }
        const events = await response.json();

        // Transform events to match the expected format
        const transformedEvents = events.map((event: any) => ({
          id: event.id,
          name: event.name,
          date: new Date(event.date).toISOString().split("T")[0],
          time: event.time,
          description: event.description,
          imageUrl: event.imageUrl,
          eventName: event.eventName,
          participationType: event.participationType,
          eventType: event.eventType,
          registrationFee: 0, // Default to 0 if not specified
          prizePool: event.prizePool || 0,
        }));

        setTechnicalEventsData(
          transformedEvents.filter(
            (event: { eventType: EventType }) =>
              event.eventType === EventType.TECHNICAL
          )
        );

        setNonTechnicalEventsData(
          transformedEvents.filter(
            (event: { eventType: EventType }) =>
              event.eventType === EventType.NON_TECHNICAL ||
              event.eventType === EventType.SPORTS
          )
        );
      } catch (err) {
        toast.error("Failed to fetch events");
        console.error("Failed to fetch events:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include", // Add credentials to include cookies
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
            <h1 className="text-[1.125rem] font-[700]">Technical Events</h1>
            <div className="overflow-y-auto no-visible-scrollbar pr-2 max-h-[420px] scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <EventCard cardData={technicalEventsData} userId={user?.id} />
              )}
            </div>
          </div>
          <div className="">
            <ThreeDCard info={tshirtCard} />
          </div>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row-reverse gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
            <h1 className="text-[1.125rem] font-[700]">
              Non-technical & Sports Events
            </h1>
            <div className="overflow-y-auto no-visible-scrollbar pr-2 max-h-[420px] scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <EventCard cardData={nonTechnicalEventsData} userId={user?.id} />
              )}
            </div>
          </div>
          <div className="">
            <ThreeDCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
