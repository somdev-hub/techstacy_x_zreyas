"use client";

import { Year } from "@prisma/client";
import Image from "next/image";

type TeamMember = {
  id: string;
  name: string;
  year: Year;
  imageUrl: string | null;
  sic?: string; // Make SIC optional to handle existing implementations
  eventName?: string; // Event name field
};

type TeamDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teamLeader: TeamMember;
  teamMembers: TeamMember[];
};

export function TeamDetailsModal({ isOpen, onClose, teamLeader, teamMembers }: TeamDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-2xl mx-4 bg-neutral-800 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Team Details</h2>
            {teamLeader.eventName && (
              <p className="text-sm text-neutral-400 mt-1">Event: {teamLeader.eventName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Team Leader</h3>
            <div className="flex items-center gap-4 p-4 bg-neutral-700 rounded-lg">
              {teamLeader.imageUrl && teamLeader.imageUrl !== "" ? (
                <Image
                  src={teamLeader.imageUrl}
                  alt={teamLeader.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-neutral-600 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {teamLeader.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-lg">{teamLeader.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <p className="text-sm text-neutral-300">
                    <span className="text-neutral-400">Year:</span> {teamLeader.year.replace("_", " ")}
                  </p>
                  {teamLeader.sic && (
                    <p className="text-sm text-neutral-300">
                      <span className="text-neutral-400">SIC:</span> {teamLeader.sic}
                    </p>
                  )}
                </div>
                <div className="mt-1 text-xs text-green-500 font-medium">Team Leader</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <div className="text-sm text-neutral-400">
                {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
              </div>
            </div>
            <div className="space-y-3">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 bg-neutral-700 rounded-lg">
                    {member.imageUrl && member.imageUrl !== "" ? (
                      <Image
                        src={member.imageUrl}
                        alt={member.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-neutral-600 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <p className="text-sm text-neutral-300">
                          <span className="text-neutral-400">Year:</span> {member.year.replace("_", " ")}
                        </p>
                        {member.sic && (
                          <p className="text-sm text-neutral-300">
                            <span className="text-neutral-400">SIC:</span> {member.sic}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 text-center py-4 bg-neutral-700 rounded-lg">No other team members</p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}