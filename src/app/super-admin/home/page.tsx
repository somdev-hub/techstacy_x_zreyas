"use client";
import React, { useState } from "react";
import { EventType, Events, ParticipationType, Year } from "@prisma/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TeamDetailsModal } from "@/components/TeamDetailsModal";

// Admin form schema
const adminFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  sic: z
    .string()
    .length(8, "SIC must be exactly 8 characters")
    .regex(
      /^\d{2}[A-Za-z0-9]{4}\d{2}$/,
      "SIC must start and end with 2 digits"
    ),
  year: z.nativeEnum(Year, {
    required_error: "Please select a year",
  }),
  event: z.nativeEnum(Events, {
    required_error: "Please select an event",
  }),
});

// Event form schema
const eventFormSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  eventName: z.nativeEnum(Events, {
    required_error: "Please select an event",
  }),
  prizePool: z.string().min(1, "Please enter a prize pool"),
  venue: z.string().min(1, "Please enter a venue"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.string().min(1, "Please enter a date"),
  time: z.string().min(1, "Please enter a time"),
  eventType: z.nativeEnum(EventType, {
    required_error: "Please select an event type",
  }),
  participationType: z.nativeEnum(ParticipationType, {
    required_error: "Please select a participation type",
  }),
  image: z.any()
});

type AdminFormValues = z.infer<typeof adminFormSchema>;
type EventFormValues = z.infer<typeof eventFormSchema>;

type EventParticipant = {
  id: number;  // Changed from string to number to match API
  eventId: number;
  userId: number;  // Changed from string to number to match API
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
    participationType: ParticipationType; // Added this field
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

type TeamMember = {
  id: string;
  name: string;
  year: Year;
  imageUrl: string | null;
};

const Home = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [teamParticipants, setTeamParticipants] = useState<EventParticipant[]>([]);
  const [allEvents, setAllEvents] = useState<{
    event: Events;
    eventType: EventType;
    participationType: ParticipationType;
    totalParticipants: number;
    eventId: number;
  }[]>([]);
  const [totalParticipants, setTotalParticipants] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [participantsFilterEventType, setParticipantsFilterEventType] = useState('');
  const [participantsFilterEventName, setParticipantsFilterEventName] = useState('');
  const [summaryFilterEventType, setSummaryFilterEventType] = useState('');
  const [summaryFilterEventName, setSummaryFilterEventName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<{
    leader: TeamMember;
    members: TeamMember[];
  } | null>(null);

  // Fetch data and organize it for both tables
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [participantsRes, totalsRes] = await Promise.all([
          fetch('/api/events/get-event-participants'),
          fetch('/api/events/total-participantts')
        ]);

        const participantsData = await participantsRes.json();
        const totalsData = await totalsRes.json();

        // Set participants data for the team leaders table
        setTeamParticipants(participantsData);
        setTotalParticipants(totalsData);

        // Process events data for the summary table
        const uniqueEvents = new Map();
        participantsData.forEach((participant: EventParticipant) => {
          const key = `${participant.event.eventName}-${participant.event.eventType}`;
          if (!uniqueEvents.has(key)) {
            uniqueEvents.set(key, {
              event: participant.event.eventName,
              eventType: participant.event.eventType,
              participationType: participant.event.participationType,
              totalParticipants: totalsData[participant.eventId] || 0,
              eventId: participant.eventId
            });
          }
        });
        setAllEvents(Array.from(uniqueEvents.values()));
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch participants data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter participants for team leaders table
  const filteredParticipants = React.useMemo(() => {
    return teamParticipants.filter(participant => {
      const isTeamLeader = !participant.mainParticipantId;
      const matchesEventType = !participantsFilterEventType || participant.event.eventType === participantsFilterEventType;
      const matchesEventName = !participantsFilterEventName || participant.event.eventName === participantsFilterEventName;
      return isTeamLeader && matchesEventType && matchesEventName;
    });
  }, [teamParticipants, participantsFilterEventType, participantsFilterEventName]);

  // Filter events for summary table
  const filteredEvents = React.useMemo(() => {
    return allEvents.filter(event => {
      const matchesEventType = !summaryFilterEventType || event.eventType === summaryFilterEventType;
      const matchesEventName = !summaryFilterEventName || event.event === summaryFilterEventName;
      return matchesEventType && matchesEventName;
    });
  }, [allEvents, summaryFilterEventType, summaryFilterEventName]);

  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    formState: { errors: adminErrors },
    reset: resetAdminForm,
  } = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema),
  });

  const {
    register: registerEvent,
    handleSubmit: handleEventSubmit,
    formState: { errors: eventErrors },
    reset: resetEventForm
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
  });

  const onAdminSubmit = async (data: AdminFormValues) => {
    try {
      setIsAdminSubmitting(true);
      const response = await fetch('/api/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin');
      }

      toast.success('Admin created successfully. Share the credentials with the admin.');
      resetAdminForm();
    } catch (error) {
      console.error('Failed to create admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create admin');
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const onEventSubmit = async (data: EventFormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('eventName', data.eventName);
      formData.append('prizePool', data.prizePool);
      formData.append('description', data.description);
      formData.append('venue', data.venue);
      formData.append('date', data.date);
      formData.append('time', data.time);
      formData.append('eventType', data.eventType);
      formData.append('participationType', data.participationType);
      
      if (data.image?.[0]) {
        formData.append('image', data.image[0]);
      }

      const response = await fetch('/api/create-event', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event');
      }

      toast.success('Event created successfully');
      resetEventForm(); // Reset form after successful submission
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get team members for a leader
  const getTeamMembers = (participant: EventParticipant) => {
    return participant.otherParticipants.map(member => ({
      id: member.id.toString(),
      name: member.user.name,
      year: member.user.year,
      imageUrl: member.user.imageUrl
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
        imageUrl: participant.user.imageUrl
      },
      members: teamMembers
    });
  };

  return (
    <div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px] w-[70%]">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-[1.125rem] font-[700]">
                Event Participation (Team Leaders)
              </h1>
              <div className="flex gap-4">
                <select 
                  className="bg-neutral-700 rounded-md px-3 py-1"
                  value={participantsFilterEventType}
                  onChange={(e) => setParticipantsFilterEventType(e.target.value)}
                >
                  <option value="">Event Type</option>
                  {Object.values(EventType).map((eventType, key) => (
                    <option value={eventType} key={key}>
                      {eventType}
                    </option>
                  ))}
                </select>
                <select 
                  className="bg-neutral-700 rounded-md px-3 py-1"
                  value={participantsFilterEventName}
                  onChange={(e) => setParticipantsFilterEventName(e.target.value)}
                >
                  <option value="">Event Name</option>
                  {Object.values(Events).map((event, key) => (
                    <option value={event} key={key}>
                      {event}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">SIC</th>
                    <th className="text-left p-2">Year</th>
                    <th className="text-left p-2">Event</th>
                    <th className="text-left p-2">Team Size</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4">Loading...</td>
                    </tr>
                  ) : filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4">No participants found</td>
                    </tr>
                  ) : (
                    filteredParticipants.map((participant) => {
                      const teamSize = participant.otherParticipants.length + 1; // +1 for the leader
                      return (
                        <tr key={participant.id} className="border-b border-neutral-700">
                          <td className="p-2">{participant.user.name}</td>
                          <td className="p-2">{participant.user.sic}</td>
                          <td className="p-2">{participant.user.year.replace('_', ' ')}</td>
                          <td className="p-2">{participant.event.eventName}</td>
                          <td className="p-2">{teamSize}</td>
                          <td className="p-2">
                            <button 
                              className="bg-blue-600 px-3 py-1 rounded-md"
                              onClick={() => handleViewTeam(participant)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-[30%]">
            <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
              <h1 className="text-[1.125rem] font-[700]">Add admins</h1>
              <form
                onSubmit={handleAdminSubmit(onAdminSubmit)}
                className="flex gap-4 mt-4 flex-col w-full"
              >
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    {...registerAdmin("name")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  {adminErrors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {adminErrors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    {...registerAdmin("email")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  {adminErrors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {adminErrors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone"
                    {...registerAdmin("phone")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  {adminErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {adminErrors.phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    {...registerAdmin("password")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  {adminErrors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {adminErrors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="w-full">
                    <input
                      type="text"
                      placeholder="SIC (e.g. 21ABCD22)"
                      {...registerAdmin("sic")}
                      className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                    />
                    {adminErrors.sic && (
                      <p className="text-red-500 text-sm mt-1">
                        {adminErrors.sic.message}
                      </p>
                    )}
                  </div>
                  <div className="w-full">
                    <select
                      {...registerAdmin("year")}
                      className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                    >
                      <option value="">Select Year</option>
                      {Object.values(Year).map((yearValue, key) => (
                        <option value={yearValue} key={key}>
                          {yearValue.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    {adminErrors.year && (
                      <p className="text-red-500 text-sm mt-1">
                        {adminErrors.year.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <select
                    {...registerAdmin("event")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full no-visible-scrollbar"
                  >
                    <option value="">Select event</option>
                    {Object.values(Events).map((event, key) => (
                      <option value={event} key={key}>
                        {event}
                      </option>
                    ))}
                  </select>
                  {adminErrors.event && (
                    <p className="text-red-500 text-sm mt-1">
                      {adminErrors.event.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isAdminSubmitting}
                  className="bg-blue-600 px-3 py-2 h-10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAdminSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Add'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-[30%] ">
            <h1 className="text-[1.125rem] font-[700]">Add events</h1>
            <form
              onSubmit={handleEventSubmit(onEventSubmit)}
              className="flex flex-col gap-4 mt-4 w-full"
            >
              <div>
                <input
                  type="text"
                  placeholder="Event Name"
                  {...registerEvent("name")}
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                {eventErrors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {eventErrors.name.message}
                  </p>
                )}
              </div>
              <div className="">
                <select
                  {...registerEvent("eventName")}
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                >
                  <option value="">Select Event</option>
                  {Object.values(Events).map((yearValue, key) => (
                    <option value={yearValue} key={key}>
                      {yearValue.replace("_", " ")}
                    </option>
                  ))}
                </select>
                {adminErrors.year && (
                  <p className="text-red-500 text-sm mt-1">
                    {adminErrors.year.message}
                  </p>
                )}
              </div>
              <div className="">
                {/* eent prize pool */}
                <input
                  type="text"
                  placeholder="Event Prize Pool"
                  {...registerEvent("prizePool")}
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                {eventErrors.prizePool && (
                  <p className="text-red-500 text-sm mt-1">
                    {eventErrors.prizePool.message}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Description"
                  {...registerEvent("description")}
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                {eventErrors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {eventErrors.description.message}
                  </p>
                )}
              </div>
              <div className="">
                <input
                  type="text"
                  placeholder="Venue"
                  {...registerEvent("venue")}
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                {eventErrors.venue && (
                  <p className="text-red-500 text-sm mt-1">
                    {eventErrors.venue.message}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <input
                    type="date"
                    placeholder="Date"
                    {...registerEvent("date")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  {eventErrors.date && (
                    <p className="text-red-500 text-sm mt-1">
                      {eventErrors.date.message}
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <input
                    type="time"
                    placeholder="Time"
                    {...registerEvent("time")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  {eventErrors.time && (
                    <p className="text-red-500 text-sm mt-1">
                      {eventErrors.time.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <select
                    {...registerEvent("eventType")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  >
                    <option value="">Select Type</option>
                    {Object.values(EventType).map((type, key) => (
                      <option value={type} key={key}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {eventErrors.eventType && (
                    <p className="text-red-500 text-sm mt-1">
                      {eventErrors.eventType.message}
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <select
                    {...registerEvent("participationType")}
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  >
                    <option value="">Select Participation Type</option>
                    {Object.values(ParticipationType).map((type, key) => (
                      <option value={type} key={key}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {eventErrors.participationType && (
                    <p className="text-red-500 text-sm mt-1">
                      {eventErrors.participationType.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="flex items-center h-10 bg-neutral-700 rounded-md px-3 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    {...registerEvent("image")}
                    className="w-full text-sm text-white appearance-none file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-white file:bg-blue-600 hover:file:bg-blue-700 file:cursor-pointer focus:outline-none file:h-7 h-7"
                  />
                </label>
                {typeof eventErrors.image?.message === 'string' && (
                  <p className="text-red-500 text-sm mt-1">
                    {eventErrors.image.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 px-3 py-2 h-10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Add'
                )}
              </button>
            </form>
          </div>
          <div className="w-[70%]">
            <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px]">
              <div className="flex justify-between">
                <h1 className="text-[1.125rem] font-[700]">
                  Participants by event
                </h1>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-4">
                    <select 
                      className="bg-neutral-700 rounded-md px-3 py-1"
                      value={summaryFilterEventType}
                      onChange={(e) => setSummaryFilterEventType(e.target.value)}
                    >
                      <option value="">Event Type</option>
                      {Object.values(EventType).map((eventType, key) => (
                        <option value={eventType} key={key}>
                          {eventType}
                        </option>
                      ))}
                    </select>
                    <select 
                      className="bg-neutral-700 rounded-md px-3 py-1"
                      value={summaryFilterEventName}
                      onChange={(e) => setSummaryFilterEventName(e.target.value)}
                    >
                      <option value="">Event Name</option>
                      {Object.values(Events).map((event, key) => (
                        <option value={event} key={key}>
                          {event}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left p-2">Event</th>
                      <th className="text-left p-2">Event type</th>
                      <th className="text-left p-2">Participation type</th>
                      <th className="text-left p-2">Total participants</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center p-4">Loading...</td>
                      </tr>
                    ) : filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-4">No events found</td>
                      </tr>
                    ) : (
                      filteredEvents.map((event, index) => (
                        <tr key={index} className="border-b border-neutral-700">
                          <td className="p-2">{event.event}</td>
                          <td className="p-2">{event.eventType}</td>
                          <td className="p-2">{event.participationType}</td>
                          <td className="p-2">{event.totalParticipants}</td>
                          <td className="p-2">
                            <button className="bg-blue-600 px-3 py-1 rounded-md">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
