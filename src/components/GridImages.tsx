import Image from "next/image";
import React from "react";

const GridImages = () => {
  return (
    <div className="  px-8 xl:px-[5.5rem] py-8 text-white items-center flex justify-center overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-2 md:overflow-x-auto hide-scrollbar">
        <div className="flex sm:flex-col gap-2 sm:gap-0">
          <div
            data-aos="fade-down"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative overflow-hidden"
          >
            <Image
              src={"/assets/sit-events/cultural-1.jpg"}
              style={{ objectFit: "cover" }}
              fill
              className="transition-transform duration-300 hover:scale-110"
              alt="contact"
            />
          </div>
          <div
            data-aos="fade-up"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative sm:mt-2 overflow-hidden"
          >
            <Image
              src={"/assets/sit-events/cultural-1.jpg"}
              className=" transition-transform duration-300 hover:scale-110"
              style={{ objectFit: "cover" }}
              fill
              alt="contact"
            />
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 sm:gap-0">
          <div
            data-aos="fade-down-right"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative bg-gradient-to-b from-slate-900 to-slate-950 p-2"
          >
            <p className="font-[600] text-[1.5rem] lg:text-[2rem]">
              Extensive range of sports and games
            </p>
          </div>
          <div
            data-aos="fade-up-right"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative sm:mt-2 overflow-hidden"
          >
            <Image
              src={"/assets/sit-events/cultural-1.jpg"}
              style={{ objectFit: "cover" }}
              fill
              className="transition-transform duration-300 hover:scale-110"
              alt="contact"
            />
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 sm:gap-0">
          <div
            data-aos="fade-down-left"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative overflow-hidden"
          >
            <Image
              src={"/assets/sit-events/cultural-1.jpg"}
              style={{ objectFit: "cover" }}
              fill
              className="transition-transform duration-300 hover:scale-110"
              alt="contact"
            />
          </div>
          <div
            data-aos="fade-up-left"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative bg-gradient-to-b from-slate-900 to-slate-950 p-2 sm:mt-2"
          >
            <p className="font-[600] text-[1.5rem] lg:text-[2rem]">
              Carry the athletic sprit with the torch forward
            </p>
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 sm:gap-0">
          <div
            data-aos="fade-down-right"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative bg-gradient-to-b from-slate-900 to-slate-950 p-2"
          >
            <p className="font-[600] text-[1.5rem] lg:text-[2rem]">
              Enjoy the evening with music and dance
            </p>
          </div>
          <div
            data-aos="fade-up-right"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative sm:mt-2 overflow-hidden"
          >
            <Image
              src={"/assets/sit-events/cultural-1.jpg"}
              style={{ objectFit: "cover" }}
              fill
              className="transition-transform duration-300 hover:scale-110"
              alt="contact"
            />
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 sm:gap-0">
          <div
            data-aos="fade-down-left"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative overflow-hidden"
          >
            <Image
              src={"/assets/sit-events/cultural-1.jpg"}
              style={{ objectFit: "cover" }}
              fill
              className="transition-transform duration-300 hover:scale-110"
              alt="contact"
            />
          </div>
          <div
            data-aos="fade-up-left"
            className="w-[10rem] h-[10rem] lg:w-[15rem] lg:h-[15rem] relative bg-gradient-to-b from-slate-900 to-slate-950 p-2 sm:mt-2"
          >
            <p className="font-[600] text-[1.5rem] lg:text-[2rem]">
              Refresh-ments, Medals and Trophies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridImages;
