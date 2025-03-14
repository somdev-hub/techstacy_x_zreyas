"use client";
import React, { useState, useEffect } from "react";
import { EventType, Events, Year } from "@prisma/client";
import { toast } from "sonner";
import { TeamDetailsModal } from "@/components/TeamDetailsModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TeamMember = {
  id: string;
  name: string;
  year: Year;
  imageUrl: string | null;
};

interface TeamDetails {
  leader: TeamMember | null;
  members: TeamMember[];
}

const Attendance = () => {
  const [eventAttendance, setEventAttendance] = useState<
    {
      id: number;
      eventId: number;
      userId: number;
      event: { name: string };
      user: {
        id: number;
        name: string;
        sic: string;
        year: Year;
        college: string;
        imageUrl: string | null;
      };
      teamDetails: TeamDetails | null;
      createdAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterEventType, setFilterEventType] = useState("");
  const [filterEventName, setFilterEventName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null);

  // Fetch data for event attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/events/get-super-admin-event-attendance"
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch attendance");
        }

        setEventAttendance(data);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
        toast.error("Failed to fetch attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Filter attendance records
  const filteredAttendance = React.useMemo(() => {
    return eventAttendance.filter((record) => {
      const matchesEventType =
        !filterEventType || record.event.name.includes(filterEventType);
      const matchesEventName =
        !filterEventName || record.event.name === filterEventName;
      return matchesEventType && matchesEventName;
    });
  }, [eventAttendance, filterEventType, filterEventName]);

  // Get unique event names for filter dropdown
  const uniqueEventNames = React.useMemo(() => {
    return Array.from(
      new Set(eventAttendance.map((record) => record.event.name))
    );
  }, [eventAttendance]);

  return (
    <div>
      <div className="mt-8 w-full flex flex-col gap-8">
        {/* Event Attendance Table */}
        <div className="bg-neutral-800 rounded-xl shadow-md p-4 overflow-fix">
          <div className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-center mb-4">
            <h1 className="text-[1.125rem] font-[700]">Event Attendance</h1>
            <div className="flex gap-4">
              <select
                className="bg-neutral-700 rounded-md px-3 py-1"
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
              >
                <option value="">Event Type</option>
                {Object.values(EventType).map((type, key) => (
                  <option value={type} key={key}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>
              <select
                className="bg-neutral-700 rounded-md px-3 py-1"
                value={filterEventName}
                onChange={(e) => setFilterEventName(e.target.value)}
              >
                <option value="">Event Name</option>
                {uniqueEventNames.map((name, key) => (
                  <option value={name} key={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-container no-visible-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-neutral-800 z-10">
                <TableRow className="border-b border-neutral-700 hover:bg-transparent">
                  <TableHead className="text-left">Event</TableHead>
                  <TableHead className="text-left">Participant</TableHead>
                  <TableHead className="text-left">SIC</TableHead>
                  <TableHead className="text-left">Year</TableHead>
                  <TableHead className="text-left">College</TableHead>
                  <TableHead className="text-left">Time</TableHead>
                  <TableHead className="text-left">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center p-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center p-4">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record, index) => (
                    <TableRow
                      key={index}
                      className="border-b border-neutral-700"
                    >
                      <TableCell>{record.event.name}</TableCell>
                      <TableCell>{record.user.name}</TableCell>
                      <TableCell>{record.user.sic}</TableCell>
                      <TableCell>
                        {record.user.year.replace("_", " ")}
                      </TableCell>
                      <TableCell>{record.user.college}</TableCell>
                      <TableCell>
                        {new Date(record.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {record.teamDetails && record.teamDetails.leader && (
                          <button
                            className="bg-blue-600 px-3 py-1 rounded-md"
                            onClick={() => setSelectedTeam(record.teamDetails)}
                          >
                            View
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeam && selectedTeam.leader && (
        <TeamDetailsModal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          teamLeader={selectedTeam.leader}
          teamMembers={selectedTeam.members}
        />
      )}
    </div>
  );
};

export default Attendance;
