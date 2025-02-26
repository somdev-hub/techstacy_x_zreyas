import { EventCard } from "@/components/EventCards";
import { ThreeDCard } from "@/components/ThreeDCard";
import React from "react";

const Zreyas = () => {
  return (
    <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-6 w-full px-8 my-2 mr-2 rounded-2xl pb-8">
      <div className=" flex justify-between items-center">
        <div className="">
          <h1 className="text-[1.5rem] font-[700]">Zreyas</h1>
          <p className="text-[1.25rem]">Explore the annual cultural fest</p>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="flex gap-8">
          <div className="bg-neutral-800 rounded-xl shadow-md p-4 w-full">
            <h1 className="text-[1.125rem] font-[700]">Cultural Events</h1>
            <EventCard />
          </div>
          <div className="">
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
          {/* <EventCard /> */}
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
          {/* <EventCard /> */}
        </div>
      </div>
    </div>
  );
};

export default Zreyas;
