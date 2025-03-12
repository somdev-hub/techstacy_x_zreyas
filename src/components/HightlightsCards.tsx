"use client";
import Image from "next/image";
import React from "react";
import { WobbleCard } from "./ui/wobble-card";

export function HightlightsCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[500px] lg:min-h-[300px]"
        className=""
      >
        <div className="max-w-xs">
          <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            Enjoy the evening with a mix of classical plus modern dance
          </h2>
          <p className="mt-4 text-left  text-base/6 text-neutral-200">
            Witness the best of both worlds with a mix of classical and modern
            dance performances. The evening will be filled with a variety of
            dance forms, from classical to modern.
          </p>
        </div>
        <Image
          src="/assets/classical.png"
          width={500}
          height={500}
          alt="linear demo image"
          className="absolute -right-4 lg:-right-[0] grayscale filter -bottom-10 object-contain rounded-2xl"
        />
      </WobbleCard>
      <WobbleCard containerClassName="col-span-1 min-h-[300px]">
        <h2 className="max-w-80  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
          Immerse yourself in the world of music
        </h2>
        <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
          Experience the magic of music with our live performances and DJ
          sessions. Dance to the beats of your favorite songs and enjoy the
          evening with your friends and family.
        </p>
      </WobbleCard>
      <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
        <div className="max-w-sm">
          <h2 className="max-w-sm md:max-w-lg  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            Fight to win with the best combo of technical, sports, non-technical
            events.
          </h2>
          <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
            Play sports, participate in tech and non-tech events in the morning
            and enjoy the evening with dance and music performances.
          </p>
        </div>
        <Image
          src="/assets/racing-car.png"
          width={500}
          height={500}
          alt="linear demo image"
          className="absolute -right-[1.5rem] md:-right-[40%] w-3/4 sm:w-1/2 xl:w-1/4 lg:-right-[0.5rem] bottom-[-0.5rem] object-contain rounded-2xl"
        />
      </WobbleCard>
    </div>
  );
}
