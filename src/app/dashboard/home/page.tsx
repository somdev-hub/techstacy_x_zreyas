"use client";
import React, { useState } from "react";
import { EventCard } from "@/components/EventCards";
import { ThreeDCard } from "@/components/ThreeDCard";
import { FaBell, FaTimes } from "react-icons/fa";
import { Events, ParticipationType, EventType } from "@prisma/client";

// Sample notification data
const notifications = [
  {
    id: 1,
    title: "New Event Registration",
    message: "You have successfully registered for Hackathon 2023",
    time: "2 hours ago",
    read: false
  },
  {
    id: 2,
    title: "Event Reminder",
    message: "Technical Workshop starts in 3 hours",
    time: "3 hours ago",
    read: true
  },
  {
    id: 3,
    title: "Registration Deadline",
    message: "Last day to register for Coding Competition",
    time: "1 day ago",
    read: true
  }
];

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const technicalEvents: {
    id: number;
    title: string;
    date: string;
    time: string;
    desc: string;
    image: string;
    key: Events;
    participationType: ParticipationType;
    eventType: EventType;
    registrationFee: number;
    prizePool: number;
  }[] = [
    /**
     * TECH_ROADIES
  NON_TECH_ROADIES
  DEBUG
  QUIZMANIA
  CODE_RELAY
  PANCHAYAT
  SPELL_BEE
  ROBO_RACE
  ROBO_WAR
  TRESURE_HUNT
  GULLEY_CRICKET
  DUNK_THE_BALL
  DART
  PING_PONG
  FOOTSOL
  SOLO_DANCE
  DUO_DANCE
  GROUP_DANCE
  SOLO_SINGING
  DUO_SINGING
  GROUP_SINGING
  SKIT
     */
    {
      id: 1,
      title: "Technical Roadies",
      date: "21st March 2025",
      time: "9:00 AM",
      desc: "A technical treasure hunt event where participants have to solve technical puzzles and riddles to reach the final destination.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.TECH_ROADIES,
      participationType: ParticipationType.QUINTET,
      eventType: EventType.TECHNICAL,
      registrationFee: 0,
      prizePool: 3000
    },
    {
      id: 2,
      title: "Debug",
      date: "21st March 2025",
      time: "9:00 AM",
      desc: "A debugging competition where participants have to find and fix bugs in the given code.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.DEBUG,
      participationType: ParticipationType.SOLO,
      eventType: EventType.TECHNICAL,
      registrationFee: 0,
      prizePool: 3000
    },
    {
      id: 3,
      title: "Quizmania",
      date: "21st March 2025",
      time: "9:00 AM",
      desc: "A quiz competition where participants have to answer a series of questions based on various topics.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.QUIZMANIA,
      participationType: ParticipationType.SOLO,
      eventType: EventType.TECHNICAL,
      registrationFee: 0,
      prizePool: 3000
    },
    {
      id: 4,
      title: "Code Relay",
      date: "21st March 2025",
      time: "9:00 AM",
      desc: "A coding competition where participants have to solve a series of coding problems.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.CODE_RELAY,
      participationType: ParticipationType.QUAD,
      eventType: EventType.TECHNICAL,
      registrationFee: 0,
      prizePool: 3000
    },
    {
      id: 5,
      title: "Panchayat",
      date: "21st March 2025",
      time: "9:00 AM",
      desc: "A debate competition where participants have to discuss and debate on various topics.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.PANCHAYAT,
      participationType: ParticipationType.SOLO,
      eventType: EventType.TECHNICAL,
      registrationFee: 0,
      prizePool: 3000
    },
    {
      id: 6,
      title: "Spell Bee",
      date: "21st March 2025",
      time: "9:00 AM",
      desc: "A spelling competition where participants have to spell words correctly.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.SPELL_BEE,
      participationType: ParticipationType.SOLO,
      eventType: EventType.TECHNICAL,
      registrationFee: 0,
      prizePool: 3000
    }
  ];

  const nonTechnicalEvents: {
    id: number;
    title: string;
    date: string;
    time: string;
    desc: string;
    image: string;
    key: Events;
    participationType: ParticipationType;
    eventType: EventType;
    registrationFee: number;
    prizePool: number;
  }[] = [
    {
      id: 1,
      title: "Non-Technical Roadies",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A non-technical treasure hunt event where participants have to solve non-technical puzzles and riddles to reach the final destination.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.NON_TECH_ROADIES,
      participationType: ParticipationType.SOLO,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    },
    {
      id: 2,
      title: "Tresure Hunt",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A treasure hunt event where participants have to solve puzzles and riddles to reach the final destination.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.TRESURE_HUNT,
      participationType: ParticipationType.QUINTET,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    },
    {
      id: 3,
      title: "Gulley Cricket",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A cricket competition where participants have to play cricket in the streets.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.GULLEY_CRICKET,
      participationType: ParticipationType.GROUP,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    },
    {
      id: 4,
      title: "Dunk The Ball",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A basketball competition where participants have to dunk the ball.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.DUNK_THE_BALL,
      participationType: ParticipationType.SOLO,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    },
    {
      id: 5,
      title: "Dart",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A dart competition where participants have to hit the bullseye.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.DART,
      participationType: ParticipationType.SOLO,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    },
    {
      id: 6,
      title: "Ping Pong",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A table tennis competition where participants have to play table tennis.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.PING_PONG,
      participationType: ParticipationType.SOLO,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    },
    {
      id: 7,
      title: "Footsol",
      date: "22nd March 2025",
      time: "9:00 AM",
      desc: "A football competition where participants have to play football.",
      image: "https://assets.aceternity.com/demos/lana-del-rey.jpeg",
      key: Events.FOOTSOL,
      participationType: ParticipationType.GROUP,
      eventType: EventType.NON_TECHNICAL,
      registrationFee: 15,
      prizePool: 3000
    }
  ];

  const tshirtCard: {
    title: string;
    description: string;
    src: string;
  } = {
    title: "Get your event t-shirt",
    description:
      "Order your event t-shirt now and get it delivered to your doorstep.",
    src: "/assets/tshirt.png"
  };

  return (
    <div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
            <h1 className="text-[1.125rem] font-[700]">Technical Events</h1>
            <div className="overflow-y-auto no-visible-scrollbar pr-2 max-h-[420px] scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
              <EventCard cardData={technicalEvents} />
            </div>
          </div>
          <div className="">
            <ThreeDCard info={tshirtCard} />
          </div>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row-reverse gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full max-h-[475px]">
            <h1 className="text-[1.125rem] font-[700]">
              Non-technical & Sports Events
            </h1>
            <div className="overflow-y-auto no-visible-scrollbar pr-2 max-h-[420px] scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
              <EventCard cardData={nonTechnicalEvents} />
            </div>
          </div>
          <div className="">
            <ThreeDCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
