"use client";

import React, { useState, useEffect } from "react";
import { useModal } from "@/context/ModalContext";
import { useLoginModal } from "@/context/LoginModalContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openModal } = useModal();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={`fixed z-50 top-0 h-auto w-full flex justify-between items-center py-4 md:py-2 px-8 ${
        scrolled ? "glassmorphism" : ""
      } rounded-none`}
    >
      <div className="text-white flex justify-between items-center">
        <p className='text-["2rem] font-bold'>Techstacy X Zreyas</p>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-4">
        <button className="p-[1.5px] relative" onClick={openLoginModal}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
          <div className="px-8 py-2 bg-black rounded-full relative group transition duration-200 text-white hover:bg-transparent">
            Log in
          </div>
        </button>
        <button className="p-[1.5px] relative" onClick={openModal}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          <div className="px-8 py-2 bg-black rounded-full relative group transition duration-200 text-white hover:bg-transparent">
            Sign up
          </div>
        </button>
      </div>

      {/* Hamburger Menu Button */}
      <button className="md:hidden text-white" onClick={toggleMenu}>
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMenuOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 w-full md:hidden bg-black bg-opacity-90 py-4 px-8">
          <div className="flex flex-col gap-4">
            <button
              className="p-[1.5px] relative w-full"
              onClick={() => {
                openLoginModal();
                setIsMenuOpen(false);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              <div className="px-8 py-2 bg-black rounded-full relative group transition duration-200 text-white hover:bg-transparent">
                Log in
              </div>
            </button>
            <button
              className="p-[1.5px] relative w-full"
              onClick={() => {
                openModal();
                setIsMenuOpen(false);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              <div className="px-8 py-2 bg-black rounded-full relative group transition duration-200 text-white hover:bg-transparent">
                Sign up
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
