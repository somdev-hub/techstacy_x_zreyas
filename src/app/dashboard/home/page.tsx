"use client";
import React, { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCards";
import { ThreeDCard } from "@/components/ThreeDCard";
import { EventType, TshirtSize } from "@prisma/client";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

// Define an interface for the event data compatible with EventCard
interface EventData {
  id: number;
  name: string;
  date: string;
  time: string;
  description: string;
  imageUrl: string;
  eventName: string;
  participationType: string;
  eventType: EventType;
  registrationFee: number;
  prizePool: number;
  partialRegistration: boolean;
}

// Define an interface for the API response
interface EventApiResponse {
  id: string;
  name: string;
  date: Date | string;
  time: string;
  description: string;
  imageUrl: string;
  eventName: string;
  participationType: string;
  eventType: EventType;
  registrationFee?: number;
  prizePool?: number;
  partialRegistration?: boolean;
}

const Home = () => {
  const [technicalEventsData, setTechnicalEventsData] = useState<EventData[]>(
    []
  );
  const [nonTechnicalEventsData, setNonTechnicalEventsData] = useState<
    EventData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const userHook = useUser();
  const [roboRaceEvent, setRoboRaceEvent] = useState<EventData | null>(null);

  const handleTshirtOrder = async () => {
    if (!userHook.user?.id) {
      toast.error("Please login to order a t-shirt");
      return;
    }
    // Add your t-shirt order logic here
  };

  const tshirtCard = {
    title: "Get your event t-shirt",
    description:
      "Order your event t-shirt now and get it delivered to your doorstep.",
    src: "/assets/tshirt.png",
    mainButton: {
      type: "button",
      text: "Order Now",
      onClick: handleTshirtOrder,
      razorpay: true,
      paymentButtonId: process.env.NEXT_PUBLIC_RAZORPAY_TSHIRT_BUTTON_ID || "",
    },
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          toast.error("Failed to fetch events");
          throw new Error("Failed to fetch events");
        }
        const events = (await response.json()) as EventApiResponse[];

        // Transform events to match the expected format with numeric IDs
        const transformedEvents: EventData[] = events.map(
          (event: EventApiResponse) => ({
            id: parseInt(event.id) || 0, // Convert string ID to number
            name: event.name,
            date: new Date(event.date).toISOString().split("T")[0],
            time: event.time,
            description: event.description,
            imageUrl: event.imageUrl,
            eventName: event.eventName,
            participationType: event.participationType,
            eventType: event.eventType,
            registrationFee: event.registrationFee || 0, // Default to 0 if not specified
            prizePool: event.prizePool || 0,
            partialRegistration: event.partialRegistration || false, // Default to false if not specified
          })
        );

        // Find ROBO_RACE event
        const roboRace = transformedEvents.find(
          (event: EventData) => event.eventName === "ROBO_RACE"
        );
        setRoboRaceEvent(roboRace || null);

        // Filter out ROBO_RACE from technical events
        setTechnicalEventsData(
          transformedEvents.filter(
            (event: EventData) =>
              event.eventType === EventType.TECHNICAL &&
              event.eventName !== "ROBO_RACE"
          )
        );

        setNonTechnicalEventsData(
          transformedEvents.filter(
            (event: EventData) =>
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

  const roboRaceCard = roboRaceEvent
    ? {
        title: roboRaceEvent.name,
        description: roboRaceEvent.description.substring(0, 100) + "...",
        src: roboRaceEvent.imageUrl,
        event: roboRaceEvent,
      }
    : null;

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
                <EventCard
                  cardData={technicalEventsData}
                  userId={userHook.user?.id}
                />
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
                <EventCard
                  cardData={nonTechnicalEventsData}
                  userId={userHook.user?.id}
                />
              )}
            </div>
          </div>
          <div className="">
            <ThreeDCard info={roboRaceCard} isEvent={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
