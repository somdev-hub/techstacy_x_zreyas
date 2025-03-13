"use client";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { LampContainer } from "@/components/ui/lamp";
import { Button } from "@/components/ui/moving-border";
import { MusicCD } from "@/components/MusicCD";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Sliders } from "@/components/Sliders";
import { ScrollCardSec } from "@/components/ScrollCardSec";
import { TabCards } from "@/components/TabCards";
import { HightlightsCards } from "@/components/HightlightsCards";
import { useModal } from "@/context/ModalContext";
import { useLoginModal } from "@/context/LoginModalContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sponsors from "@/components/Sponsors";
import TshirtSection from "@/components/TshirtSection";
import GridImages from "@/components/GridImages";

export default function Home() {
  const { openModal } = useModal();
  const { openLoginModal } = useLoginModal();

  const products = [
    {
      title: "Moonbeam",
      thumbnail: "/assets/sit-events/cultural-1.jpg",
    },
    {
      title: "Cursor",
      thumbnail: "/assets/sit-events/tech-1.jpg",
    },
    {
      title: "Rogue",
      thumbnail: "/assets/sit-events/cultural-2.jpg",
    },

    {
      title: "Editorially",
      thumbnail: "/assets/sit-events/tech-2.jpg",
    },
    {
      title: "Editrix AI",
      thumbnail: "/assets/sit-events/cultural-3.jpg",
    },
    {
      title: "Pixel Perfect",
      thumbnail: "/assets/sit-events/tech-3.jpg",
    },

    {
      title: "Algochurn",
      thumbnail: "/assets/sit-events/cultural-4.jpg",
    },
    {
      title: "Aceternity UI",
      thumbnail: "/assets/sit-events/tech-7.jpg",
    },
    {
      title: "Tailwind Master Kit",
      thumbnail: "/assets/sit-events/tech-4.jpg",
    },
    {
      title: "SmartBridge",
      thumbnail: "/assets/sit-events/cultural-5.jpg",
    },
    {
      title: "Renderwork Studio",
      thumbnail: "/assets/sit-events/tech-6.jpg",
    },

    {
      title: "Golden Bells Academy",
      thumbnail: "/assets/sit-events/tech-8.jpg",
    },
    {
      title: "Creme Digital",
      thumbnail: "/assets/sit-events/cultural-6.jpg",
    },
    {
      title: "Invoker Labs",
      thumbnail: "/assets/sit-events/cultural-7.jpg",
    },
    {
      title: "E Free Invoice",
      thumbnail: "/assets/sit-events/cultural-8.jpg",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-between overflow-x-hidden pb-24 no-visible-scrollbar">
        {/* <div className="mt-8"></div> */}
        <LampContainer>
          <motion.h1
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="mt-[2rem] bg-gradient-to-br from-slate-300 to-slate-500 py-1 bg-clip-text text-center font-medium tracking-tight text-transparent"
          >
            <span className="text-[3rem] sm:text-[3rem] md:text-[4rem]  lg:text-[5rem] xl:text-[6rem] ">
              <span className="font-starblazer heading-text">Techstacy</span>{" "}
              <span>X </span>
              <span className="font-samarkan text-[4.5rem] lg:text-[8rem]">
                Zreyas
              </span>
            </span>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] pt-4 sm:pt-6 md:pt-8">
              21st and 22nd March, 2025
            </p>
            <div className="flex gap-4  w-full md:flex-row items-center justify-center  sm:space-x-4 mt-4 sm:mt-6 md:mt-8 px-4">
              <Button
                borderRadius="1.75rem"
                className="w-full sm:w-auto bg-slate-900 text-white border-slate-800 text-sm sm:text-base"
                onClick={openLoginModal}
              >
                Log in
              </Button>
              <Button
                borderRadius="1.75rem"
                className="w-full  sm:w-auto bg-slate-900 text-white border-slate-800 text-sm sm:text-base"
                onClick={openModal}
              >
                Sign up
              </Button>
            </div>
          </motion.h1>
        </LampContainer>

        <div className="mt-8 " id="parallax">
          <HeroParallax products={products} />
        </div>

        {/* Fix the grid container to not create horizontal overflow */}
        <div className="px-4 md:px-[4rem] xl:px-[8rem] w-full overflow-hidden mt-[8rem] border-none">
          <h2 className="md:max-w-7xl w-full pl-4 mx-auto text-center text-[2.25rem] md:text-5xl font-bold text-neutral-200 font-sans mb-12">
            We bring you the Experience
          </h2>
          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
            <GridItem
              area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
              icon={<Box className="h-4 w-4 text-neutral-400" />}
              title="Innovate with the tech events"
              description="Techstacy brings you the best tech events in the college."
            />

            <GridItem
              area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
              icon={<Settings className="h-4 w-4 text-neutral-400" />}
              title="Dance and steal the show"
              description="Zreyas is the way to go if you want to dance and have fun."
            />

            <GridItem
              area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
              icon={<Lock className="h-4 w-4 text-neutral-400" />}
              title="Race and win the game"
              description="ROBO RACE is the event for you if you love racing."
            />

            <GridItem
              area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
              icon={<Sparkles className="h-4 w-4 text-neutral-400" />}
              title="Show up your style with our branded T-shirt"
              description="Get the best T-shirt in the fest and show your style."
            />

            <GridItem
              area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
              icon={<Search className="h-4 w-4 text-neutral-400" />}
              title="Swing with the music in the DJ night"
              description="Get ready to dance with the best DJ in the fest."
            />
          </ul>
        </div>

        <div className="">
          <Sliders />
        </div>
        <div className="">
          <ScrollCardSec />
        </div>
        <div className="w-full overflow-hidden">
          <TabCards />
        </div>
        <div className="w-full overflow-hidden mt-[8rem] px-4  xl:px-0">
          <HightlightsCards />
        </div>
        <div className="w-full">
          <TshirtSection />
        </div>
        <div className="w-full">
          <GridImages />
        </div>
        <div className="w-full">
          <Sponsors />
        </div>
      </div>
      <MusicCD />
      <Footer />
    </>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-3xl border border-gray-600 p-2 md:rounded-3xl md:p-3 ">
        <GlowingEffect
          blur={0}
          borderWidth={3}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-0.75 p-6 shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2 ">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl/[1.375rem] font-semibold font-sans -tracking-4 md:text-2xl/[1.875rem] text-balance text-white">
                {title}
              </h3>
              <h2
                className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm/[1.125rem] 
              md:text-base/[1.375rem]  text-neutral-400"
              >
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
