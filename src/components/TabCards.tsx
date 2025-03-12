"use client";

import Image from "next/image";
import { Tabs } from "./ui/tabs-aceternity";

export function TabCards() {
  const tabs = [
    {
      title: "Dance",
      value: "product",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p>Dancing</p>
          <DummyContent image="/assets/event/dance.jpg" />
        </div>
      ),
    },
    {
      title: "Singing",
      value: "services",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p>Services tab</p>
          <DummyContent image="/assets/event/singing.jpg" />
        </div>
      ),
    },
    {
      title: "Skit",
      value: "playground",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p>Playground tab</p>
          <DummyContent image="/assets/event/skit.jpg" />
        </div>
      ),
    },
    {
      title: "Anchoring",
      value: "content",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p>Content tab</p>
          <DummyContent image="/assets/event/anchoring.jpg" />
        </div>
      ),
    },
    {
      title: "Ramp Walk",
      value: "random",
      content: (
        <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-gradient-to-br from-purple-700 to-violet-900">
          <p>Random tab</p>
          <DummyContent image="/assets/event/ramp walk.jpg" />
        </div>
      ),
    },
  ];

  return (
    <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative flex flex-col w-full items-center justify-start mb-44 dark">
      <div className="w-full h-full px-4 lg:px-20 xl:px-[8rem]">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}

const DummyContent = ({ image }: { image: string }) => {
  return (
    <Image
      src={image}
      alt="dummy image"
      width="1000"
      height="1000"
      className="object-cover object-center h-[60%]  md:h-[90%] absolute bottom-[-0.25rem] md:-bottom-20 inset-x-0 w-[90%] rounded-xl mx-auto"
    />
  );
};
