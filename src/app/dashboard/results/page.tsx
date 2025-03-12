"use client";
import React, { useEffect, useState } from "react";
import { Events, EventType } from "@prisma/client";

type EventResult = {
  id: number;
  eventName: Events;
  eventType: EventType;
  name: string;
  participants: {
    user: {
      name: string;
      sic: string;
    };
    position: number;
  }[];
};

export default function Results() {
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events/get-all-results');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch results');
        }

        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const technicalEvents = events.filter(event => event.eventType === EventType.TECHNICAL);
  const nonTechnicalAndSportsEvents = events.filter(event => 
    event.eventType === EventType.NON_TECHNICAL || 
    event.eventType === EventType.SPORTS
  );

  const EventSection = ({ title, events }: { title: string; events: EventResult[] }) => (
    <div className="mt-8 w-full">
      <div className="flex gap-8">
        <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
          <h1 className="text-[1.125rem] font-[700] mb-4">{title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="bg-neutral-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">{event.name}</h3>
                {event.participants.length > 0 ? (
                  <div className="space-y-2">
                    {event.participants.map((participant, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-sm">{participant.user.name}</p>
                          <p className="text-xs text-neutral-400">{participant.user.sic}</p>
                        </div>
                        <div className="bg-blue-600 px-2 py-1 rounded text-sm">
                          {participant.position}
                          {participant.position === 1 ? "st" : 
                            participant.position === 2 ? "nd" : 
                            participant.position === 3 ? "rd" : "th"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-400">
                    Results to be announced
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-4 md:px-8 my-2 mr-2 rounded-2xl">
      <div className="">
        <h1 className="text-[1.5rem] font-[700]">Results</h1>
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
