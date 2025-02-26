"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/context/ModalContext";
import { useLoginModal } from "@/context/LoginModalContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { openModal } = useModal();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);

    // Check initial scroll position
    handleScroll();

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed z-50 top-0 h-auto w-full flex justify-between items-center py-2 px-8 ${
        scrolled ? "glassmorphism" : ""
      } rounded-none`}
    >
      <div className=" text-white flex justify-between items-center ">
        <p className='text-["2rem] font-bold'>Techstacy X Zreyas</p>
      </div>
      <div className="flex gap-4">
        <button className="p-[1.5px] relative" onClick={openLoginModal}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
          <div className="px-8 py-2  bg-black rounded-full  relative group transition duration-200 text-white hover:bg-transparent">
            Log in
          </div>
        </button>
        <button className="p-[1.5px] relative" onClick={openModal}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          <div className="px-8 py-2  bg-black rounded-full  relative group transition duration-200 text-white hover:bg-transparent">
            Sign up
          </div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
