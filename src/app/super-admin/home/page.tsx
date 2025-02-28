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
                  <tr className="border-b border-neutral-700">
                    <td className="p-2">John Doe</td>
                    <td className="p-2">2024</td>
                    <td className="p-2">Hackathon</td>
                    <td className="p-2">
                      <button className="bg-blue-600 px-3 py-1 rounded-md">
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="w-[30%]">
            <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
              <h1 className="text-[1.125rem] font-[700]">Add admins</h1>
              <div className="flex gap-4 mt-4 flex-col w-full">
                <input
                  type="text"
                  placeholder="Name"
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                <input
                  type="text"
                  placeholder="Email"
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                <input
                  type="text"
                  placeholder="Password"
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Year"
                    className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                  />
                  <select className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full">
                    <option value="">Select Batch</option>
                    <option value="A">1st year</option>
                    <option value="B">2nd year</option>
                    <option value="C">3rd year</option>
                    <option value="D">4th year</option>
                  </select>
                </div>
                <select className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full no-visible-scrollbar">
                  <option value="">Select event</option>
                  {Object.values(Events).map((event, key) => (
                    <option value={event} key={key}>
                      {event}
                    </option>
                  ))}
                </select>

                <button className="bg-blue-600 px-3 py-2 h-10 rounded-md">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-[30%] max-h-[475px]">
            <h1 className="text-[1.125rem] font-[700]">Add events</h1>
            <div className="flex flex-col gap-4 mt-4 w-full">
              <input
                type="text"
                placeholder="Event Name"
                className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
              />
              <input
                type="text"
                placeholder="Description"
                className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Date"
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
                <input
                  type="text"
                  placeholder="Time"
                  className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
                />
              </div>
              <div className="flex gap-4">
                <select className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full">
                  <option value="">Select Type</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="NON_TECHNICAL">Non-Technical</option>
                  <option value="SPORTS">Sports</option>
                </select>
                <select className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full">
                  <option value="">Select Participation Type</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="TEAM">Team</option>
                </select>
              </div>
              <button className="bg-blue-600 px-3 py-2 h-10 rounded-md">
                Add
              </button>
            </div>
          </div>
          <div className="w-[70%]">
            <div className="bg-neutral-800 rounded-xl shadow-md p-4 max-h-[475px]">
              <div className="flex justify-between">
                <h1 className="text-[1.125rem] font-[700]">
                  Participants by event
                </h1>
                <div className="flex justify-between items-center mb-4">
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
              </div>
              <div className="">
                {/* Dummy data */}
                {(() => {
                  const dummyData = [
                    {
                      event: "Hackathon",
                      eventType: "TECHNICAL",
                      participationType: "TEAM",
                      totalParticipants: 120
                    },
                    {
                      event: "Cricket",
                      eventType: "SPORTS",
                      participationType: "TEAM",
                      totalParticipants: 88
                    },
                    {
                      event: "Chess",
                      eventType: "SPORTS",
                      participationType: "INDIVIDUAL",
                      totalParticipants: 45
                    },
                    {
                      event: "Coding Contest",
                      eventType: "TECHNICAL",
                      participationType: "INDIVIDUAL",
                      totalParticipants: 200
                    }
                  ];

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-neutral-700">
                            <th className="text-left p-2">Event</th>
                            <th className="text-left p-2">Event type</th>
                            <th className="text-left p-2">
                              Participation type
                            </th>
                            <th className="text-left p-2">
                              Total participants
                            </th>
                            <th className="text-left p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dummyData.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-neutral-700"
                            >
                              <td className="p-2">{item.event}</td>
                              <td className="p-2">{item.eventType}</td>
                              <td className="p-2">{item.participationType}</td>
                              <td className="p-2">{item.totalParticipants}</td>
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
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
