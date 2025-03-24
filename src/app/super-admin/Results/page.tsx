"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Events, EventType } from "@prisma/client";

type Event = {
  id: number;
  name: string;
  eventName: Events;
  eventType: EventType;
  eventResults: Array<{
    userId: number;
    position: number;
  }>;
  participants: Array<{
    id: number;
    userId: number;
    isAttended: boolean;
    user: {
      name: string;
      sic: string;
    };
    otherParticipants: Array<{
      id: number;
      userId: number;
      isAttended: boolean;
      user: {
        name: string;
        sic: string;
      };
    }>;
  }>;
};

export default function Results() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, participantsRes] = await Promise.all([
        fetch("/api/events/get-all-events"),
        fetch("/api/events/get-all-participants"),
      ]);

      if (!eventsRes.ok || !participantsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [eventsData, participantsData] = await Promise.all([
        eventsRes.json(),
        participantsRes.json(),
      ]);

      const eventsWithParticipants = eventsData.map((event: Event) => ({
        ...event,
        participants: participantsData.filter(
          (p: any) => p.eventId === event.id && !p.mainParticipantId
        ),
      }));

      setEvents(eventsWithParticipants);
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

  const canAssignResult = (participant: Event["participants"][0]): boolean => {
    // Always allow assigning results regardless of attendance
    return true;
  };

  const technicalEvents = events.filter(
    (event) => event.eventType === "TECHNICAL"
  );
  const nonTechnicalAndSportsEvents = events.filter(
    (event) =>
      event.eventType === "NON_TECHNICAL" || event.eventType === "SPORTS"
  );

  return (
    <div className="bg-neutral-900  pt-4 sm:pt-6 w-full px-2 sm:px-4 md:px-8 my-2 mr-0 sm:mr-2 rounded-2xl">
      <div className="px-2 sm:px-0">
        <h1 className="text-[1.25rem] sm:text-[1.5rem] font-[700]">Manage Results</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading results...</div>
        </div>
      ) : (
        <>
          <div className="mt-4 sm:mt-8 w-full">
            <div className="flex gap-4 sm:gap-8">
              <div className="bg-neutral-800 rounded-xl shadow-md p-2 sm:p-4 w-full">
                <h1 className="text-[1rem] sm:text-[1.125rem] font-[700] mb-2 sm:mb-4 top-0 bg-neutral-800 py-2 z-10">Technical Events</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {technicalEvents.map((event) => (
                    <div key={event.id} className="bg-neutral-700 rounded-lg p-2 sm:p-4 flex flex-col">
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 top-0 bg-neutral-700 py-2 z-10">{event.name}</h3>
                      <div className="space-y-3 sm:space-y-4 overflow-y-auto no-visible-scrollbar max-h-[60vh]">
                        {event.participants.map((participant) => {
                          const existingResult = event.eventResults?.find(
                            (r) => r.userId === participant.userId
                          );

                          // Check attendance for both main participant and team members
                          const hasTeamAttended = canAssignResult(participant);

                          return (
                            <div
                              key={participant.id}
                              className={`bg-neutral-800 rounded-lg p-3 border ${
                                participant.otherParticipants.length > 0
                                  ? "border-blue-500/30"
                                  : "border-neutral-600"
                              }`}
                            >
                              <div className="flex flex-col  sm:justify-between gap-2 sm:gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm flex items-center gap-2">
                                        {participant.user.name}
                                        {/* Removed attendance indicator */}
                                      </p>
                                      <p className="text-xs text-neutral-400">
                                        {participant.user.sic}
                                      </p>
                                    </div>
                                    {participant.otherParticipants.length > 0 && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                        Team
                                      </span>
                                    )}
                                  </div>
                                  {participant.otherParticipants.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-neutral-300">
                                        Team Members:
                                      </p>
                                      {participant.otherParticipants.map((member) => (
                                        <div
                                          key={member.id}
                                          className="pl-2 flex items-center gap-2"
                                        >
                                          <p className="text-xs">
                                            {member.user.name}
                                            {/* Removed attendance indicator */}
                                          </p>
                                          <p className="text-xs text-neutral-400">
                                            {member.user.sic}
                                          </p>
                                        </div>
                                      ))}
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
                                            "/api/results/super-admin",
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
                                                `Cannot assign result - Following team members have not attended: ${data.notAttendedMembers.join(
                                                  ", "
                                                )}`
                                              );
                                            } else {
                                              throw new Error(
                                                data.error ||
                                                  "Failed to update result"
                                              );
                                            }
                                            return;
                                          }

                                          toast.success(
                                            "Result updated successfully"
                                          );
                                          fetchData();
                                        } catch (error) {
                                          console.error(
                                            "Failed to update result:",
                                            error
                                          );
                                          toast.error(
                                            error instanceof Error
                                              ? error.message
                                              : "Failed to update result"
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
                                    <span className="text-xs sm:text-sm text-neutral-400">
                                      Position selection unavailable
                                    </span>
                                  )}
                                </div>
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

          <div className="mt-4 sm:mt-8 w-full mb-4">
            <div className="flex gap-4 sm:gap-8">
              <div className="bg-neutral-800 rounded-xl shadow-md p-2 sm:p-4 w-full">
                <h1 className="text-[1rem] sm:text-[1.125rem] font-[700] mb-2 sm:mb-4  top-0 bg-neutral-800 py-2 z-10">Non-technical & Sports Events</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {nonTechnicalAndSportsEvents.map((event) => (
                    <div key={event.id} className="bg-neutral-700 rounded-lg p-2 sm:p-4 flex flex-col">
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3  top-0 bg-neutral-700 py-2 z-10">{event.name}</h3>
                      <div className="space-y-3 sm:space-y-4 overflow-y-auto no-visible-scrollbar max-h-[60vh]">
                        {event.participants.map((participant) => {
                          const existingResult = event.eventResults?.find(
                            (r) => r.userId === participant.userId
                          );

                          // Check attendance for both main participant and team members
                          const hasTeamAttended = canAssignResult(participant);

                          return (
                            <div
                              key={participant.id}
                              className={`bg-neutral-800 rounded-lg p-3 border ${
                                participant.otherParticipants.length > 0
                                  ? "border-blue-500/30"
                                  : "border-neutral-600"
                              }`}
                            >
                              <div className="flex flex-col sm:justify-between gap-2 sm:gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm flex items-center gap-2">
                                        {participant.user.name}
                                        {/* Removed attendance indicator */}
                                      </p>
                                      <p className="text-xs text-neutral-400">
                                        {participant.user.sic}
                                      </p>
                                    </div>
                                    {participant.otherParticipants.length > 0 && (
                                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                        Team
                                      </span>
                                    )}
                                  </div>
                                  {participant.otherParticipants.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-neutral-300">
                                        Team Members:
                                      </p>
                                      {participant.otherParticipants.map((member) => (
                                        <div
                                          key={member.id}
                                          className="pl-2 flex items-center gap-2"
                                        >
                                          <p className="text-xs">
                                            {member.user.name}
                                            {/* Removed attendance indicator */}
                                          </p>
                                          <p className="text-xs text-neutral-400">
                                            {member.user.sic}
                                          </p>
                                        </div>
                                      ))}
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
                                            "/api/results/super-admin",
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
                                                `Cannot assign result - Following team members have not attended: ${data.notAttendedMembers.join(
                                                  ", "
                                                )}`
                                              );
                                            } else {
                                              throw new Error(
                                                data.error ||
                                                  "Failed to update result"
                                              );
                                            }
                                            return;
                                          }

                                          toast.success(
                                            "Result updated successfully"
                                          );
                                          fetchData();
                                        } catch (error) {
                                          console.error(
                                            "Failed to update result:",
                                            error
                                          );
                                          toast.error(
                                            error instanceof Error
                                              ? error.message
                                              : "Failed to update result"
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
                                    <span className="text-xs sm:text-sm text-neutral-400">
                                      Position selection unavailable
                                    </span>
                                  )}
                                </div>
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
        </>
      )}
    </div>
  );
}
