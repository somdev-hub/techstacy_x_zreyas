import { EventCard } from "@/components/EventCards";
import React from "react";

const Purchases = () => {
  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-8 my-2 mr-2 rounded-2xl">
      <div className="">
        <h1 className="text-[1.5rem] font-[700]">Purchases</h1>
        {/* <p className="text-[1.25rem]">Welcome to your dashboard</p> */}
      </div>
      <div className="mt-8 w-full">
        <div className="flex gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
            <h1 className="text-[1.125rem] font-[700]">Technical Events</h1>
            <EventCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
