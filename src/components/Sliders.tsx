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

const DummyContent = () => {
  return (
    <>
      {[...new Array(3).fill(1)].map((_, index) => {
        return (
          <div
            key={"dummy-content" + index}
            className="bg-neutral-700 p-8 md:p-14 rounded-3xl mb-4"
          >
            <p className="text-[#F5F5F7] text-base md:text-2xl font-sans max-w-3xl mx-auto">
              <span className="font-bold text-[#F5F5F7]">
                The first rule of Apple club is that you boast about Apple club.
              </span>{" "}
              Keep a journal, quickly jot down a grocery list, and take amazing
              class notes. Want to convert those notes to text? No problem.
              Langotiya jeetu ka mara hua yaar is ready to capture every
              thought.
            </p>
            <Image
              src="https://assets.aceternity.com/macbook.png"
              alt="Macbook mockup from Aceternity UI"
              height="500"
              width="500"
              className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
            />
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
    content: <DummyContent />,
  },
  {
    category: "Quizmania",
    title: "One more quiz to test your knowledge",
    src: "/assets/landing-page-events/quizmania.jpg",
    content: <DummyContent />,
  },
  {
    category: "Robo Race",
    title: "Motors and machines are in interest? Join us",
    src: "/assets/landing-page-events/roborace.jpg",
    content: <DummyContent />,
  },

  {
    category: "Code Relay",
    title: "Team up and code your way to the top",
    src: "/assets/landing-page-events/code-relay.jpg",
    content: <DummyContent />,
  },
  {
    category: "Debug",
    title: "Debugging is an art, be the artist.",
    src: "/assets/landing-page-events/debug.jpg",
    content: <DummyContent />,
  },
  {
    category: "Panchayat",
    title: "The ultimate team debate competition",
    src: "/assets/landing-page-events/panchayat.jpg",
    content: <DummyContent />,
  },
];
