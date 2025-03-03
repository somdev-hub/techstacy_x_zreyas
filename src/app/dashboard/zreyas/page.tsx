"use client";
import { EventCard } from "@/components/EventCards";
import { ThreeDCard } from "@/components/ThreeDCard";
import { Events, ParticipationType, EventType } from "@prisma/client";
import React from "react";

const Zreyas = () => {
  const culturalEvents = [
    {
      id: 1,
      name: "Solo Dance",
      date: "21st March",
      time: "10:00 AM",
      description: "Solo dance competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.SOLO_DANCE,
      participationType: ParticipationType.SOLO,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    },
    {
      id: 2,
      name: "Solo Singing",
      date: "21st March",
      time: "10:00 AM",
      description: "Solo singing competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.SOLO_SINGING,
      participationType: ParticipationType.SOLO,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    },
    {
      id: 3,
      name: "Group Dance",
      date: "21st March",
      time: "10:00 AM",
      description: "Group dance competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.GROUP_DANCE,
      participationType: ParticipationType.GROUP,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    },
    {
      id: 4,
      name: "Group Singing",
      date: "21st March",
      time: "10:00 AM",
      description: "Group singing competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.GROUP_SINGING,
      participationType: ParticipationType.GROUP,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    },
    {
      id: 5,
      name: "Skit",
      date: "21st March",
      time: "10:00 AM",
      description: "Skit competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.SKIT,
      participationType: ParticipationType.GROUP,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    },
    {
      id: 6,
      name: "Duo Dance",
      date: "21st March",
      time: "10:00 AM",
      description: "Duo dance competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.DUO_DANCE,
      participationType: ParticipationType.DUO,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    },
    {
      id: 7,
      name: "Duo Singing",
      date: "21st March",
      time: "10:00 AM",
      description: "Duo singing competition",
      imageUrl: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      eventName: Events.DUO_SINGING,
      participationType: ParticipationType.DUO,
      eventType: EventType.CULTURAL,
      registrationFee: 0,
      prizePool: 0
    }
  ];

  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-8 my-2 mr-2 rounded-2xl pb-8">
      <div className="flex justify-between items-center">
        <div className="">
          <h1 className="text-[1.5rem] font-[700]">Zreyas</h1>
          <p className="text-[1.25rem]">Explore the annual cultural fest</p>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex gap-8 flex-col lg:flex-row">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full lg:w-2/3 max-h-[475px]">
            <h1 className="text-[1.125rem] font-[700]">Cultural Events</h1>
            <div className="overflow-y-auto no-visible-scrollbar pr-2 max-h-[420px] scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
              <EventCard 
                cardData={culturalEvents}
              />
            </div>
          </div>
          <div className="lg:w-1/3">
            <ThreeDCard />
          </div>
        </div>
      </div>

      <div className="mt-8 w-full">
        <div className="bg-neutral-800 rounded-xl shadow-md p-6 w-full flex justify-between items-center">
          <div className="w-[80%]">
            <h1 className="text-[1.25rem] font-[700]">
              Register for Formal anchoring
            </h1>
            <p className="mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab iure,
              eveniet vitae, sunt itaque alias nostrum amet sequi incidunt
              quibusdam impedit ducimus? Quod culpa quos unde sapiente sint!
              Corporis, dolorem.
            </p>
          </div>
          <div className="">
            <button className="bg-white text-black rounded-md p-2 px-4 font-bold">
              Sign me up
            </button>
          </div>
        </div>
        <div className="bg-neutral-800 mt-8 rounded-xl shadow-md p-6 w-full flex justify-between items-center">
          <div className="w-[80%]">
            <h1 className="text-[1.25rem] font-[700]">
              Register for Informal anchoring
            </h1>
            <p className="mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ab iure,
              eveniet vitae, sunt itaque alias nostrum amet sequi incidunt
              quibusdam impedit ducimus? Quod culpa quos unde sapiente sint!
              Corporis, dolorem.
            </p>
          </div>
          <div className="">
            <button className="bg-white text-black rounded-md p-2 px-4 font-bold">
              Sign me up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Zreyas;
