"use client";
import React from "react";
import { EventType, Events } from "@prisma/client";

const Home = () => {
  return (
    <div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px] w-[70%]">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-[1.125rem] font-[700]">
                Event Participation
              </h1>
              <div className="flex gap-4">
                <select className="bg-neutral-700 rounded-md px-3 py-1">
                  <option value="">Event Type</option>
                  {Object.values(EventType).map((eventType, key) => (
                    <option value={eventType} key={key}>
                      {eventType}
                    </option>
                  ))}
                </select>
                <select className="bg-neutral-700 rounded-md px-3 py-1">
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
                    <th className="text-left p-2">Year</th>
                    <th className="text-left p-2">Event</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "John Doe",
                      year: "2024",
                      event: "Hackathon"
                    },
                    {
                      name: "Jane Smith",
                      year: "2023",
                      event: "Workshop"
                    },
                    {
                      name: "Mike Johnson",
                      year: "2025",
                      event: "Coding Contest"
                    },
                    {
                      name: "Sarah Williams",
                      year: "2024",
                      event: "Tech Talk"
                    }
                  ].map((participant, index) => (
                    <tr key={index} className="border-b border-neutral-700">
                      <td className="p-2">{participant.name}</td>
                      <td className="p-2">{participant.year}</td>
                      <td className="p-2">{participant.event}</td>
                      <td className="p-2">
                        <button className="bg-blue-600 px-3 py-1 rounded-md">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-[30%]">
            <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
              <h1 className="text-[1.125rem] font-[700] mb-4">Scan QR Code</h1>
              <div className="flex flex-col gap-4">
                <div className="relative h-[18rem] bg-neutral-700 rounded-lg flex items-center justify-center">
                  {/* QR Scanner overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-blue-500 rounded-lg"></div>

                  {/* Center QR Scanner Icon and Text */}
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-blue-500 opacity-50"
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
                    <span className="text-blue-500 font-medium">Scan QR</span>
                  </div>

                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
                </div>

                <button className="flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded-md transition-colors">
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
                  Manual Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 w-full">
        <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px] w-full">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-[1.125rem] font-[700]">Event Participation</h1>
            <div className="flex gap-4">
              <select className="bg-neutral-700 rounded-md px-3 py-1">
                <option value="">Event Type</option>
                {Object.values(EventType).map((eventType, key) => (
                  <option value={eventType} key={key}>
                    {eventType}
                  </option>
                ))}
              </select>
              <select className="bg-neutral-700 rounded-md px-3 py-1">
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
                  <th className="text-left p-2">Year</th>
                  <th className="text-left p-2">SIC</th>
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Check-in time</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "John Doe",
                    year: "2024",
                    sic: "21BCE1234",
                    event: "Hackathon",
                    checkInTime: "10:30 AM"
                  },
                  {
                    name: "Jane Smith",
                    year: "2023",
                    sic: "21BCE5678",
                    event: "Workshop",
                    checkInTime: "11:45 AM"
                  },
                  {
                    name: "Mike Johnson",
                    year: "2025",
                    sic: "21BCE9012",
                    event: "Seminar",
                    checkInTime: "09:15 AM"
                  }
                ].map((participant, index) => (
                  <tr key={index} className="border-b border-neutral-700">
                    <td className="p-2">{participant.name}</td>
                    <td className="p-2">{participant.year}</td>
                    <td className="p-2">{participant.sic}</td>
                    <td className="p-2">{participant.event}</td>
                    <td className="p-2">{participant.checkInTime}</td>
                    <td className="p-2">
                      <button className="bg-blue-600 px-3 py-1 rounded-md">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
