"use client";
import React, { useEffect, useState } from "react";
import { Events, EventType } from "@prisma/client";
import { toast } from "sonner";

type Event = {
  id: number;
  name: string;
  eventName: Events;
  eventType: EventType;
  participants: {
    id: number;
    userId: number;
    user: {
      name: string;
      sic: string;
    };
  }[];
  eventResults: {
    userId: number;
    position: number;
  }[];
};

export default function Results() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, participantsRes] = await Promise.all([
        fetch('/api/events/get-all-events'),
        fetch('/api/events/get-all-participants')
      ]);

      if (!eventsRes.ok || !participantsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [eventsData, participantsData] = await Promise.all([
        eventsRes.json(),
        participantsRes.json()
      ]);

      const eventsWithParticipants = eventsData.map((event: Event) => ({
        ...event,
        participants: participantsData.filter(
          (p: any) => p.eventId === event.id && !p.mainParticipantId
        )
      }));

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const technicalEvents = events.filter(event => event.eventType === EventType.TECHNICAL);
  const nonTechnicalAndSportsEvents = events.filter(event => 
    event.eventType === EventType.NON_TECHNICAL || 
    event.eventType === EventType.SPORTS
  );

  const EventSection = ({ title, events }: { title: string; events: Event[] }) => (
    <div className="mt-8 w-full">
      <div className="flex gap-8">
        <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
          <h1 className="text-[1.125rem] font-[700] mb-4">{title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-neutral-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">{event.name}</h3>
                <div className="space-y-4">
                  {event.participants.map((participant) => {
                    const existingResult = event.eventResults?.find(
                      r => r.userId === participant.userId
                    );

                    return (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{participant.user.name}</p>
                          <p className="text-xs text-neutral-400">{participant.user.sic}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            className="bg-neutral-600 rounded-md px-3 py-1"
                            value={existingResult?.position || ""}
                            onChange={async (e) => {
                              try {
                                const response = await fetch("/api/results/super-admin", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    eventId: event.id,
                                    userId: participant.userId,
                                    position: parseInt(e.target.value)
                                  })
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to update result');
                                }
                                
                                toast.success("Result updated successfully");
                                fetchData();
                              } catch (error) {
                                toast.error("Failed to update result");
                              }
                            }}
                          >
                            <option value="">Select Position</option>
                            {[1, 2, 3].map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-8 my-2 mr-2 rounded-2xl">
      <div className="">
        <h1 className="text-[1.5rem] font-[700]">Manage Results</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading results...</div>
        </div>
      ) : (
        <>
          <EventSection title="Technical Events" events={technicalEvents} />
          <EventSection title="Non-technical & Sports Events" events={nonTechnicalAndSportsEvents} />
        </>
      )}
    </div>
  );
}