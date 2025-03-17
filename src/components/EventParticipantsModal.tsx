import { Events, EventType, ParticipationType, Year } from "@prisma/client";
import { useState } from "react";

type TeamMember = {
  id: string;
  name: string;
  year: Year;
  sic: string;
  imageUrl: string | null;
  isConfirmed: boolean;
};

export type Team = {
  teamLeader: TeamMember;
  members: TeamMember[];
};

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    event: Events;
    eventType: EventType;
    participationType: ParticipationType;
    participants: Team[];
  };
}

export function EventParticipantsModal({
  isOpen,
  onClose,
  event,
}: EventParticipantsModalProps) {
  const [selectedYear, setSelectedYear] = useState<Year | "">("");

  if (!isOpen) return null;

  const filteredTeams = event.participants.filter((team) => {
    if (!selectedYear) return true;
    return team.teamLeader.year === selectedYear || team.members.some(member => member.year === selectedYear);
  });

  const totalTeams = event.participants.length;
  const yearWiseCounts = event.participants.reduce((acc, team) => {
    // Count team leader
    acc[team.teamLeader.year] = (acc[team.teamLeader.year] || 0) + 1;
    // Count team members
    team.members.forEach(member => {
      acc[member.year] = (acc[member.year] || 0) + 1;
    });
    return acc;
  }, {} as Record<Year, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-4xl mx-4 bg-neutral-800 rounded-xl shadow-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto no-visible-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Event Participants</h2>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <p className="text-sm text-neutral-400">
                {event.event} - {event.eventType} ({event.participationType})
              </p>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                {totalTeams} {totalTeams === 1 ? 'team' : 'teams'} registered
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="flex gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as Year | "")}
              className="bg-neutral-700 rounded-md px-3 py-1 text-sm"
            >
              <option value="">All Years</option>
              {Object.values(Year).map((year) => (
                <option key={year} value={year}>
                  {year.replace("_", " ")} ({yearWiseCounts[year] || 0} participants)
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-neutral-400 mt-4 md:mt-0">
            Showing {filteredTeams.length} of {totalTeams} teams
          </div>
        </div>

        <div className="space-y-6">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team, index) => (
              <div key={index} className="bg-neutral-700/50 rounded-lg p-4 space-y-4">
                {/* Team Leader Section */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">
                    Team Leader
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-neutral-700 rounded-lg">
                    <div className="w-12 h-12 bg-neutral-600 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {team.teamLeader.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between flex-wrap gap-2 md:gap-0">
                        <p className="font-medium">{team.teamLeader.name}</p>
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                          Confirmed
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <p className="text-sm text-neutral-300">
                          <span className="text-neutral-400">Year:</span>{" "}
                          {team.teamLeader.year.replace("_", " ")}
                        </p>
                        <p className="text-sm text-neutral-300">
                          <span className="text-neutral-400">SIC:</span>{" "}
                          {team.teamLeader.sic}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members Section */}
                {team.members && team.members.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-neutral-400">
                        Team Members
                      </h3>
                      <span className="text-xs text-neutral-400">
                        {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 p-4 bg-neutral-700 rounded-lg"
                        >
                          <div className="w-12 h-12 bg-neutral-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 md:gap-0 justify-between">
                              <p className="font-medium">{member.name}</p>
                              <div
                                className={`px-2 py-1 w-fit text-xs rounded ${
                                  member.isConfirmed
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {member.isConfirmed ? "Confirmed" : "Pending"}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <p className="text-sm text-neutral-300">
                                <span className="text-neutral-400">Year:</span>{" "}
                                {member.year.replace("_", " ")}
                              </p>
                              <p className="text-sm text-neutral-300">
                                <span className="text-neutral-400">SIC:</span>{" "}
                                {member.sic}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-neutral-400 py-8">
              {selectedYear ? 'No teams found for the selected year' : 'No participants found for this event'}
            </p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}