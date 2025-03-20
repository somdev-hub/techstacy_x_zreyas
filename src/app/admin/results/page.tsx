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
  isAttended: boolean;
  otherParticipants: {
    id: number;
    userId: number;
    user: {
      id: number;
      name: string;
      sic: string;
    };
    isAttended: boolean;
  }[];
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

  const canAssignResult = (participant: EventParticipant): boolean => {
    // Check if the main participant has attended
    if (!participant.isAttended) return false;

    // For team events, check if all members have attended
    if (participant.otherParticipants.length > 0) {
      return participant.otherParticipants.every(member => member.isAttended);
    }

    // For solo events, just check the main participant's attendance
    return participant.isAttended;
  };

  return (
    <div className="mt-4 sm:mt-8 w-full flex flex-col gap-4 sm:gap-8 px-2 sm:px-4 no-visible-scrollbar">
      <div className="bg-neutral-800 rounded-xl shadow-md p-2 sm:p-4">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h1 className="text-[1rem] sm:text-[1.125rem] font-[700] sticky top-0 bg-neutral-800 py-2 z-10">Manage Event Results</h1>
        </div>
        <div className="overflow-x-auto no-visible-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-base sm:text-lg">Loading...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-2 sm:p-4">No events found</div>
          ) : (
            <div className="grid gap-3 sm:gap-6">
              {events.map((event) => {
                const eventParticipants = participants.filter(
                  (p) => p.event.id === event.id && !p.mainParticipantId
                );

                return (
                  <div key={event.id} className="bg-neutral-700 rounded-xl p-2 sm:p-4 flex flex-col">
                    <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 sticky top-0 bg-neutral-700 py-2 z-10">
                      {event.eventName}
                    </h2>
                    <div className="space-y-3 sm:space-y-4 overflow-y-auto no-visible-scrollbar max-h-[60vh]">
                      {eventParticipants.map((participant) => {
                        const existingResult =
                          participant.event.eventResults?.find(
                            (r) => r.userId === participant.userId
                          );
                        
                        const hasTeamAttended = canAssignResult(participant);
                        const notAttendedMembers = participant.otherParticipants.filter(m => !m.isAttended);

                        return (
                          <div
                            key={participant.id}
                            className={`bg-neutral-800 rounded-lg p-3 border ${
                              participant.otherParticipants.length > 0 
                                ? 'border-blue-500/30' 
                                : 'border-neutral-600'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm flex items-center gap-2">
                                      {participant.user.name}
                                      {!participant.isAttended && (
                                        <span className="text-red-400 text-xs">(Not Attended)</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-neutral-400">{participant.user.sic}</p>
                                  </div>
                                  {participant.otherParticipants.length > 0 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                      Team
                                    </span>
                                  )}
                                </div>
                                {participant.otherParticipants.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-neutral-300">Team Members:</p>
                                    {participant.otherParticipants.map(member => (
                                      <div key={member.id} className="pl-2 flex items-center gap-2">
                                        <p className="text-xs">
                                          {member.user.name}
                                          {!member.isAttended && (
                                            <span className="text-red-400 ml-1">(Not Attended)</span>
                                          )}
                                        </p>
                                        <p className="text-xs text-neutral-400">{member.user.sic}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {participant.otherParticipants.length > 0 && notAttendedMembers.length > 0 && (
                                  <div className="mt-2 text-xs text-red-400">
                                    Pending Attendance: {notAttendedMembers.map(m => m.user.name).join(", ")}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 items-center">
                                {hasTeamAttended ? (
                                  <select
                                    className="w-full sm:w-auto bg-neutral-600 rounded-md px-2 sm:px-3 py-1 text-sm"
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
                                          const data = await response.json();
                                          if (data.notAttendedMembers) {
                                            toast.error(
                                              `Cannot assign result - Following team members have not attended: ${data.notAttendedMembers.join(", ")}`
                                            );
                                          } else {
                                            throw new Error(data.error || "Failed to assign result");
                                          }
                                          return;
                                        }

                                        toast.success("Result assigned successfully");
                                        fetchData();
                                      } catch (error) {
                                        console.error("Failed to assign result:", error);
                                        toast.error(
                                          error instanceof Error ? error.message : "Failed to assign result"
                                        );
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
                                ) : (
                                  <span className="text-xs sm:text-sm text-neutral-400">Position selection unavailable</span>
                                )}
                              </div>
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
