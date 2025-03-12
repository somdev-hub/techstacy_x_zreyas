"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Events } from "@prisma/client";

type AdminEvent = {
  id: number;
  eventName: Events;
};

type EventParticipant = {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    sic: string;
  };
  event: {
    id: number;
    eventName: Events;
    eventResults: {
      userId: number;
      position: number;
    }[];
  };
  mainParticipantId: number | null;
};

export default function Results() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, participantsResponse] = await Promise.all([
        fetch("/api/events/get-admin-events"),
        fetch("/api/events/get-admin-event-participants"),
      ]);

      if (!eventsResponse.ok || !participantsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const eventsData = await eventsResponse.json();
      const participantsData = await participantsResponse.json();

      setEvents(eventsData);
      setParticipants(participantsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mt-8 w-full flex flex-col gap-8">
      <div className="bg-neutral-800 rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-[1.125rem] font-[700]">Manage Event Results</h1>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center p-4">No events found</div>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => {
                const eventParticipants = participants.filter(
                  (p) => p.event.id === event.id && !p.mainParticipantId
                );

                return (
                  <div key={event.id} className="bg-neutral-700 rounded-xl p-4">
                    <h2 className="text-lg font-semibold mb-4">
                      {event.eventName}
                    </h2>
                    <div className="space-y-4">
                      {eventParticipants.map((participant) => {
                        const existingResult =
                          participant.event.eventResults.find(
                            (r) => r.userId === participant.userId
                          );

                        return (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between"
                          >
                            <span>
                              {participant.user.name} ({participant.user.sic})
                            </span>
                            <div className="flex gap-2 items-center">
                              <select
                                className="bg-neutral-600 rounded-md px-3 py-1"
                                value={existingResult?.position || ""}
                                onChange={async (e) => {
                                  try {
                                    const response = await fetch(
                                      "/api/results",
                                      {
                                        method: "POST",
                                        body: JSON.stringify({
                                          eventId: event.id,
                                          userId: participant.userId,
                                          position: parseInt(e.target.value),
                                        }),
                                      }
                                    );

                                    if (!response.ok) {
                                      throw new Error(
                                        "Failed to assign result"
                                      );
                                    }

                                    toast.success(
                                      "Result assigned successfully"
                                    );
                                    // Refresh data to show updated results
                                    fetchData();
                                  } catch (error) {
                                    console.log(
                                      "Failed to assign result:",
                                      error
                                    );

                                    toast.error("Failed to assign result");
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
