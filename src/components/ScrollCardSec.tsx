"use client";
import React from "react";
import Image from "next/image";
import { ContainerScroll } from "./ui/container-scroll-animation";

export function ScrollCardSec() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-white mb-2 md:mb-10">
              Unleash the magic of <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                DJ RB India
              </span>
            </h1>
          </>
        }
      >
        <Image
          src="/assets/dj.jpg"
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover object-center h-full "
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
