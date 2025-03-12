"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { EventType, Events, ParticipationType, Year } from "@prisma/client";
import { toast } from "sonner";
import { TeamDetailsModal } from "@/components/TeamDetailsModal";
import { Html5QrcodeScanner } from "html5-qrcode";
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

type EventParticipant = {
  id: number;
  eventId: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    imageUrl: string | null;
    college: string;
    year: Year;
    sic: string;
    phone: string;
  };
  event: {
    name: string;
    eventName: Events;
    eventType: EventType;
    participationType: ParticipationType;
    imageUrl: string | null;
  };
  mainParticipantId: number | null;
  otherParticipants: {
    id: number;
    userId: number;
    user: {
      id: number;
      name: string;
      email: string;
      imageUrl: string | null;
      college: string;
      year: Year;
      sic: string;
      phone: string;
    };
  }[];
};

const Home = () => {
  const [teamParticipants, setTeamParticipants] = useState<EventParticipant[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [participantsFilterEventType, setParticipantsFilterEventType] =
    useState("");
  const [participantsFilterEventName, setParticipantsFilterEventName] =
    useState("");
  const [selectedTeam, setSelectedTeam] = useState<{
    leader: TeamMember;
    members: TeamMember[];
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scanInProgressRef = useRef(false);
  const [eventAttendance, setEventAttendance] = useState<
    {
      event: { name: string };
      user: {
        name: string;
        sic: string;
        year: string;
        college: string;
        imageUrl: string | null;
      };
      teamDetails: {
        leader: TeamMember;
        members: TeamMember[];
      } | null;
      createdAt: string;
    }[]
  >([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [adminEvents, setAdminEvents] = useState<
    { id: number; eventName: Events }[]
  >([]);

  // Fetch data for event participants
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/events/get-admin-event-participants"
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch participants");
        }

        setTeamParticipants(data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to fetch participants data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch data for event attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);
        const response = await fetch("/api/events/get-admin-event-attendance");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch attendance");
        }

        setEventAttendance(data);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
        toast.error("Failed to fetch attendance data");
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Fetch admin's events
  useEffect(() => {
    const fetchAdminEvents = async () => {
      try {
        const response = await fetch("/api/events/get-admin-events");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch admin events");
        }

        setAdminEvents(data);
      } catch (error) {
        console.error("Failed to fetch admin events:", error);
        toast.error("Failed to fetch admin events");
      }
    };

    fetchAdminEvents();
  }, []);

  // Filter participants
  const filteredParticipants = React.useMemo(() => {
    return teamParticipants.filter((participant) => {
      const isTeamLeader = !participant.mainParticipantId;
      const matchesEventType =
        !participantsFilterEventType ||
        participant.event.eventType === participantsFilterEventType;
      const matchesEventName =
        !participantsFilterEventName ||
        participant.event.eventName === participantsFilterEventName;
      const isAdminEvent = adminEvents.some(
        (ae) => ae.eventName === participant.event.eventName
      );
      return (
        isTeamLeader && matchesEventType && matchesEventName && isAdminEvent
      );
    });
  }, [
    teamParticipants,
    participantsFilterEventType,
    participantsFilterEventName,
    adminEvents,
  ]);

  // Function to get team members for a leader
  const getTeamMembers = (participant: EventParticipant) => {
    return participant.otherParticipants.map((member) => ({
      id: member.id.toString(),
      name: member.user.name,
      year: member.user.year,
      imageUrl: member.user.imageUrl,
    }));
  };

  // Handle view button click
  const handleViewTeam = (participant: EventParticipant) => {
    const teamMembers = getTeamMembers(participant);
    setSelectedTeam({
      leader: {
        id: participant.id.toString(),
        name: participant.user.name,
        year: participant.user.year,
        imageUrl: participant.user.imageUrl,
      },
      members: teamMembers,
    });
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    // Prevent multiple simultaneous scan attempts
    if (scanInProgressRef.current) return;

    try {
      scanInProgressRef.current = true;

      console.log("QR code scanned:", decodedText);

      const response = await fetch("/api/events/mark-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrCode: decodedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark attendance");
      }

      const data = await response.json();
      toast.success(
        `Attendance marked for ${data.participant.name} - ${data.participant.event}`
      );

      // Refresh the attendance list
      const refreshResponse = await fetch(
        "/api/events/get-admin-event-attendance"
      );
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setEventAttendance(refreshData);
      }

      // Reset scanning state
      stopScanner();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to mark attendance"
      );
    } finally {
      scanInProgressRef.current = false;
    }
  }, []);

  const onScanFailure = (error: string | Error) => {
    // Ignore scan failures as they happen frequently when no QR code is detected
    // console.debug("QR code scan error:", error);
  };

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScannerInitialized(false);
  }, []);

  const startScanner = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
  }, [isScanning]);

  useEffect(() => {
    if (isScanning && !scannerInitialized) {
      // Small timeout to ensure DOM element is ready
      const timeoutId = setTimeout(() => {
        try {
          const qrContainer = document.getElementById("qr-reader");
          if (!qrContainer) {
            console.error("QR reader container not found");
            return;
          }

          // Clean up any previous instances
          while (qrContainer.firstChild) {
            qrContainer.removeChild(qrContainer.firstChild);
          }

          console.log("Initializing QR scanner...");
          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true,
            },
            /* verbose= */ false
          );

          scannerRef.current = scanner;
          scanner.render(onScanSuccess, onScanFailure);
          setScannerInitialized(true);
          console.log("QR scanner initialized");
        } catch (error) {
          console.error("Failed to initialize QR scanner:", error);
          toast.error("Failed to initialize camera. Please try again.");
          setIsScanning(false);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    return () => {};
  }, [isScanning, scannerInitialized, onScanSuccess, onScanFailure]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error cleaning up scanner:", error);
        }
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="mt-8 w-full flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-3 md:p-4 md:w-[70%] w-full overflow-fix">
            <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center mb-3">
              <h1 className="text-[1rem] md:text-[1.125rem] font-[700]">
                Event Participation
              </h1>
              <div className="flex gap-3">
                <select
                  className="bg-neutral-700 rounded-md px-2 py-1 text-sm md:text-base"
                  value={participantsFilterEventType}
                  onChange={(e) =>
                    setParticipantsFilterEventType(e.target.value)
                  }
                >
                  <option value="">Event Type</option>
                  {Object.values(EventType).map((eventType, key) => (
                    <option value={eventType} key={key}>
                      {eventType}
                    </option>
                  ))}
                </select>
                <select
                  className="bg-neutral-700 rounded-md px-2 py-1 text-sm md:text-base"
                  value={participantsFilterEventName}
                  onChange={(e) =>
                    setParticipantsFilterEventName(e.target.value)
                  }
                >
                  <option value="">Event Name</option>
                  {adminEvents.map((event, key) => (
                    <option value={event.eventName} key={key}>
                      {event.eventName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="table-container no-visible-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-neutral-800 z-10">
                  <TableRow className="border-b border-neutral-700 hover:bg-transparent">
                    <TableHead className="text-left">Name</TableHead>
                    <TableHead className="text-left">SIC</TableHead>
                    <TableHead className="text-left">Year</TableHead>
                    <TableHead className="text-left">Event</TableHead>
                    <TableHead className="text-left">Team</TableHead>
                    <TableHead className="text-left">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No participants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.map((participant) => {
                      const teamSize = participant.otherParticipants.length + 1; // +1 for the leader
                      return (
                        <TableRow
                          key={participant.id}
                          className="border-b border-neutral-700"
                        >
                          <TableCell>{participant.user.name}</TableCell>
                          <TableCell>{participant.user.sic}</TableCell>
                          <TableCell>
                            {participant.user.year.replace("_", " ")}
                          </TableCell>
                          <TableCell>{participant.event.eventName}</TableCell>
                          <TableCell>{teamSize}</TableCell>
                          <TableCell>
                            <button
                              className="bg-blue-600 px-2 py-0.5 md:px-3 md:py-1 rounded-md text-sm whitespace-nowrap"
                              onClick={() => handleViewTeam(participant)}
                            >
                              View
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="md:w-[30%] w-full">
            {/* QR scanning section - no changes needed */}
            <div className="bg-neutral-800 rounded-xl shadow-md p-3 md:p-4 w-full max-h-[475px]">
              <h1 className="text-[1rem] md:text-[1.125rem] font-[700] mb-3">
                Scan QR Code
              </h1>
              <div className="flex flex-col gap-3">
                {isScanning ? (
                  <>
                    <div
                      id="qr-reader"
                      className="w-full h-[16rem] md:h-[18rem]"
                    />
                    <button
                      onClick={stopScanner}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors text-sm md:text-base"
                    >
                      Stop Scanning
                    </button>
                  </>
                ) : (
                  <>
                    <div className="relative h-[16rem] md:h-[18rem] bg-neutral-700 rounded-lg flex items-center justify-center">
                      {/* QR Scanner overlay */}
                      <div className="absolute inset-4 border-2 border-dashed border-blue-500 rounded-lg"></div>

                      {/* Center QR Scanner Icon and Text */}
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 md:h-16 md:w-16 text-blue-500 opacity-50"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeWidth="1.5"
                            d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"
                          />
                          <rect x="5" y="5" width="2" height="2" />
                          <rect x="17" y="5" width="2" height="2" />
                          <rect x="5" y="17" width="2" height="2" />
                        </svg>
                        <span className="text-blue-500 font-medium text-sm md:text-base">
                          Click to Scan QR
                        </span>
                      </div>

                      {/* Corner markers */}
                      <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-blue-500"></div>

                      <button
                        onClick={startScanner}
                        className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center"
                      >
                        <span className="sr-only">Start scanning</span>
                      </button>
                    </div>

                    <button
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors text-sm md:text-base"
                      onClick={startScanner}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path
                          fillRule="evenodd"
                          d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Scan QR
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Attendance Table */}
        <div className="bg-neutral-800 rounded-xl shadow-md p-3 md:p-4 w-full overflow-fix">
          <h1 className="text-[1rem] md:text-[1.125rem] font-[700] mb-3">
            Event Attendance
          </h1>
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
                {attendanceLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : eventAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  eventAttendance.map((record, index) => (
                    <TableRow
                      key={index}
                      className="border-b border-neutral-700"
                    >
                      <TableCell>{record.event.name}</TableCell>
                      <TableCell>{record.user.name}</TableCell>
                      <TableCell>{record.user.sic}</TableCell>
                      <TableCell>
                        {record.user.year
                          ? record.user.year.replace("_", " ")
                          : ""}
                      </TableCell>
                      <TableCell>{record.user.college}</TableCell>
                      <TableCell>
                        {new Date(record.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {record.teamDetails && (
                          <button
                            className="bg-blue-600 px-2 py-0.5 md:px-3 md:py-1 rounded-md text-sm whitespace-nowrap"
                            onClick={() =>
                              record.teamDetails &&
                              setSelectedTeam({
                                leader: record.teamDetails.leader,
                                members: record.teamDetails.members,
                              })
                            }
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
      {selectedTeam && (
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

export default Home;
