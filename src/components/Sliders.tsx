"use client";
import Image from "next/image";
import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function Sliders() {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} layout={true} />
  ));

  return (
    <div className="w-full h-full py-20">
      <h2 className="md:max-w-7xl w-full pl-4 mx-auto text-center md:text-left text-[2.25rem] md:text-5xl font-bold text-neutral-200 font-sans">
        Events! Lots of Events
      </h2>
      <Carousel items={cards} />
    </div>
  );
}

const DummyContent = ({ content }: { content?: string[] }) => {
  return (
    <>
      {content?.map((para, index) => {
        return (
          <div
            key={"dummy-content" + index}
            className="bg-neutral-700 p-8 md:p-14 rounded-3xl mb-4"
          >
            <p className="text-[#F5F5F7] text-base md:text-2xl font-sans max-w-3xl mx-auto">
              {para}
            </p>
            {/* <Image
              src="https://assets.aceternity.com/macbook.png"
              alt="Macbook mockup from Aceternity UI"
              height="500"
              width="500"
              className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
            /> */}
          </div>
        );
      })}
    </>
  );
};

const data = [
  {
    category: "Technical Roadies",
    title: "Boaring Labs turns into interesting checkpoints",
    src: "/assets/landing-page-events/tech-roadies.jpeg",
    content: (
      <DummyContent
        content={[
          "Teams of 5 members compete in a series of technical challenges where they have to perform lab experiments in a certain order.",
          "Labs involve Computer Labs, Electronics Labs, Mechanical Labs, Civil Lab, and Mechanical workshop",
          "Teams must complete their experiments within the time limit to move to the next checkpoint.",
          "Without completing previous checkpoints, teams cannot move to the next checkpoint.",
        ]}
      />
    ),
  },
  {
    category: "Quizmania",
    title: "One more quiz to test your knowledge",
    src: "/assets/landing-page-events/quizmania.jpg",
    content: (
      <DummyContent
        content={[
          "Quizmania is a quiz competition where participants have to answer questions from various domains(Technical and aptitude)",
          "The quiz consists of 60 minutes and 60 questions.",
          "The team with the highest score wins the competition.",
        ]}
      />
    ),
  },
  {
    category: "Robo Race",
    title: "Motors and machines are in interest? Join us",
    src: "/assets/landing-page-events/roborace.jpg",
    content: (
      <DummyContent
        content={[
          "Robo race is the most awaited event of Techstacy X Zreyas.",
          "Participants have to build robots to race in specified race tracks.",
          "The robot that completes the finish line first wins the tournament",
        ]}
      />
    ),
  },

  {
    category: "Code Relay",
    title: "Team up and code your way to the top",
    src: "/assets/landing-page-events/code-relay.jpg",
    content: (
      <DummyContent
        content={[
          "Code relay is a team coding competition where participants have to solve coding problems in a relay fashion.",
          "The competition will be consisting of coding questions of various difficulty levels.",
          "Team members have to solve the problems one by one.",
          "If one team member completes his/her question in less time, he/she can solve the previous question of their team is it is unsolved.",
          "The team that solves all the problems in the least time wins the competition.",
        ]}
      />
    ),
  },
  {
    category: "Debug",
    title: "Debugging is an art, be the artist.",
    src: "/assets/landing-page-events/debug.jpg",
    content: (
      <DummyContent
        content={[
          "Debug is a competition where participants have to debug the given code.",
          "The competition will be consisting of 3 levels of difficulty.",
          "The participant who solves the most number of questions in the least time wins the competition.",
        ]}
      />
    ),
  },
  {
    category: "Panchayat",
    title: "The ultimate team debate competition",
    src: "/assets/landing-page-events/panchayat.jpg",
    content: (
      <DummyContent
        content={[
          "Panchayat is a team debate competition where teams have to debate on a given topic.",
          "The debate will be consisting of 3 rounds.",
          "The team that wins 2 rounds wins the competition.",
        ]}
      />
    ),
  },
];
