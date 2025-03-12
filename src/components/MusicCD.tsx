"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

export const MusicCD = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <audio ref={audioRef} src="/assets/background-music.mp3" loop />
      <motion.div
        animate={{
          rotate: isPlaying ? 360 : 0,
        }}
        transition={{
          duration: 3,
          ease: "linear",
          repeat: isPlaying ? Infinity : 0,
        }}
        onClick={handleClick}
        className="cursor-pointer group"
      >
        {/* CD Container */}
        <div className="w-20 h-20 relative rounded-full shadow-lg">
          {/* Metallic base with black gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-black via-gray-800 to-black" />

          {/* White reflection effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent" />

          {/* Center circle with play/pause */}
          <div className="absolute inset-[30%] rounded-full bg-red-500 flex items-center justify-center shadow-inner">
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>

          {/* Inner ring - changed to gray */}
          <div className="absolute inset-[15%] rounded-full border-2 border-gray-500" />
        </div>
      </motion.div>
    </div>
  );
};
