"use client";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { LampContainer } from "@/components/ui/lamp";
import { LinkPreview } from "@/components/ui/link-preview";
import { Button } from "@/components/ui/moving-border";

import { Box, Lock, Search, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Sliders } from "@/components/Sliders";
import { ScrollCardSec } from "@/components/ScrollCardSec";
import { Dock } from "@/components/Dock";
import { TabCards } from "@/components/TabCards";
import { HightlightsCards } from "@/components/HightlightsCards";
import { useModal } from "@/context/ModalContext";
import { useLoginModal } from "@/context/LoginModalContext";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { openModal } = useModal();
  const { openLoginModal } = useLoginModal();


  
  const products = [
    {
      title: "Moonbeam",
      link: "https://gomoonbeam.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/moonbeam.png"
    },
    {
      title: "Cursor",
      link: "https://cursor.so",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/cursor.png"
    },
    {
      title: "Rogue",
      link: "https://userogue.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/rogue.png"
    },

    {
      title: "Editorially",
      link: "https://editorially.org",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/editorially.png"
    },
    {
      title: "Editrix AI",
      link: "https://editrix.ai",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/editrix.png"
    },
    {
      title: "Pixel Perfect",
      link: "https://app.pixelperfect.quest",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/pixelperfect.png"
    },

    {
      title: "Algochurn",
      link: "https://algochurn.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/algochurn.png"
    },
    {
      title: "Aceternity UI",
      link: "https://ui.aceternity.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/aceternityui.png"
    },
    {
      title: "Tailwind Master Kit",
      link: "https://tailwindmasterkit.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/tailwindmasterkit.png"
    },
    {
      title: "SmartBridge",
      link: "https://smartbridgetech.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/smartbridge.png"
    },
    {
      title: "Renderwork Studio",
      link: "https://renderwork.studio",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/renderwork.png"
    },

    {
      title: "Creme Digital",
      link: "https://cremedigital.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/cremedigital.png"
    },
    {
      title: "Golden Bells Academy",
      link: "https://goldenbellsacademy.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/goldenbellsacademy.png"
    },
    {
      title: "Invoker Labs",
      link: "https://invoker.lol",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/invoker.png"
    },
    {
      title: "E Free Invoice",
      link: "https://efreeinvoice.com",
      thumbnail:
        "https://aceternity.com/images/products/thumbnails/new/efreeinvoice.png"
    }
  ];

  return (
    <>
    <Navbar />
    <div className="flex flex-col items-center justify-between overflow-x-hidden pb-24 ">
      {/* <div className="mt-8"></div> */}
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut"
          }}
          className="mt-[2rem] bg-gradient-to-br from-slate-300 to-slate-500 py-1 bg-clip-text text-center  font-medium tracking-tight text-transparent md:text-7xl"
        >
          <span className="text-[6rem] font-starblazer">
            Techstacy X Zreyas
          </span>
          <p className=" text-[2.5rem] pt-8">21st and 22nd March, 2025</p>
          <div className="flex justify-center space-x-4 mt-8">
            <Button
              borderRadius="1.75rem"
              className=" bg-slate-900  text-white  border-slate-800"
              onClick={openLoginModal}
            >
              Log in
            </Button>
            <Button
              borderRadius="1.75rem"
              className=" bg-slate-900  text-white  border-slate-800"
              onClick={openModal}
            >
              Sign up
            </Button>
          </div>
        </motion.h1>
      </LampContainer>

      <div className="mt-8">
        <HeroParallax products={products} />
      </div>

      <div className="mt-[8rem] px-[8rem] h-[100dvh] justify-center items-center flex flex-col">
        <div className=" text-neutral-400 text-xl md:text-3xl max-w-3xl mx-auto mb-10">
          <LinkPreview url="https://tailwindcss.com" className="font-bold">
            Tailwind CSS
          </LinkPreview>{" "}
          and{" "}
          <LinkPreview url="https://framer.com/motion" className="font-bold">
            Framer Motion
          </LinkPreview>{" "}
          are a great way to build modern websites.
        </div>
        <div className="text-neutral-400 text-xl md:text-3xl max-w-3xl mx-auto">
          Visit{" "}
          <LinkPreview
            url="https://ui.aceternity.com"
            className="font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-500 to-pink-500"
          >
            Aceternity UI
          </LinkPreview>{" "}
          for amazing Tailwind and Framer Motion components.
        </div>
        {/* <Meteors number={20} /> */}
      </div>

      {/* Fix the grid container to not create horizontal overflow */}
      <div className="px-4 md:px-[4rem] lg:px-[8rem] w-full overflow-hidden">
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
          <GridItem
            area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
            icon={<Box className="h-4 w-4 text-neutral-400" />}
            title="Do things the right way"
            description="Running out of copy so I'll write anything."
          />

          <GridItem
            area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
            icon={<Settings className="h-4 w-4 text-neutral-400" />}
            title="The best AI code editor ever."
            description="Yes, it's true. I'm not even kidding. Ask my mom if you don't believe me."
          />

          <GridItem
            area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
            icon={<Lock className="h-4 w-4 text-neutral-400" />}
            title="You should buy Aceternity UI Pro"
            description="It's the best money you'll ever spend"
          />

          <GridItem
            area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
            icon={<Sparkles className="h-4 w-4 text-neutral-400" />}
            title="This card is also built by Cursor"
            description="I'm not even kidding. Ask my mom if you don't believe me."
          />

          <GridItem
            area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
            icon={<Search className="h-4 w-4 text-neutral-400" />}
            title="Coming soon on Aceternity UI"
            description="I'm writing the code as I record this, no shit."
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
      <div className="w-full overflow-hidden mt-[8rem]">
        <HightlightsCards />
      </div>
      <Dock />
    </div>
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
      <div className="relative h-full rounded-2.5xl border p-2 md:rounded-3xl md:p-3">
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
