"use client";

import { Year } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  name: string;
  year: Year;
  imageUrl: string | null;
  sic?: string; // Make SIC optional to handle existing implementations
  eventName?: string; // Event name field
  isConfirmed?: boolean; // Add confirmation status
};

type TeamDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  teamLeader: TeamMember;
  teamMembers: TeamMember[];
  isSuperAdmin?: boolean; // Add prop to check if the current user is superadmin
  eventId?: number; // Add eventId prop to know which event to delete
  onTeamDeleted?: () => void; // Callback to refresh data after deletion
};

export function TeamDetailsModal({ 
  isOpen, 
  onClose, 
  teamLeader, 
  teamMembers, 
  isSuperAdmin = false, 
  eventId,
  onTeamDeleted 
}: TeamDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteTeam = async () => {
    if (!eventId) {
      toast.error("Event ID is missing. Cannot delete team.");
      return;
    }

    try {
      setIsDeleting(true);
      
      // Use the superadmin-specific endpoint if the user is a superadmin
      const endpoint = isSuperAdmin 
        ? "/api/superadmin/delete-team" 
        : "/api/events/delete-participation";
        
      // Different payload for superadmin endpoint vs participant endpoint
      const payload = isSuperAdmin 
        ? { eventId, teamLeaderId: parseInt(teamLeader.id) } 
        : { eventId };
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team participation");
      }

      const result = await response.json();
      toast.success(result.message || "Team participation deleted successfully");
      onClose();
      if (onTeamDeleted) {
        onTeamDeleted();
      }
    } catch (error) {
      console.error("Error deleting team participation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete team participation");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeletion = () => {
    const message = isSuperAdmin
      ? `Are you sure you want to delete ${teamLeader.name}'s team from this event? All team members will be removed. This action cannot be undone.`
      : `Are you sure you want to delete your team from this event? This action cannot be undone.`;
      
    if (confirm(message)) {
      handleDeleteTeam();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-2xl mx-4 bg-neutral-800 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto no-visible-scrollbar">
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
                <div className="flex justify-between">
                  <p className="font-medium text-lg">{teamLeader.name}</p>
                  <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    Confirmed
                  </div>
                </div>
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
                      <div className="flex justify-between">
                        <p className="font-medium">{member.name}</p>
                        <div className={`px-2 py-1 text-xs rounded ${
                          member.isConfirmed 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {member.isConfirmed ? "Confirmed" : "Pending"}
                        </div>
                      </div>
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

          <div className="flex justify-between mt-4">
            {isSuperAdmin && (
              <button 
                onClick={confirmDeletion}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Team"
                )}
              </button>
            )}
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}