"use client";
import Image from "next/image";
import React, { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Events, ParticipationType, EventType } from "@prisma/client";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface TeamMember {
  name: string;
  imageUrl: string | null;
  sic: string;
  isMainParticipant: boolean;
  isConfirmed: boolean;
  id: number;
  isAttended: boolean; // Added isAttended property
}

interface QRCardProps {
  cardData: {
    id: number;
    name: string;
    date: string;
    time: string;
    description: string;
    imageUrl: string;
    eventName: Events;
    participationType: ParticipationType;
    eventType: EventType;
    registrationFee: number;
    prizePool: number;
    qrCode: string;
    // isAttended: boolean;
    teammates?: TeamMember[];
  }[];
}

export function QRCard({ cardData }: QRCardProps) {
  const [active, setActive] = useState<(typeof cards)[number] | null>(null);
  const [isDeletingParticipation, setIsDeletingParticipation] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  const cards = cardData.map((event) => {
    return {
      description: event.description,
      title: event.name,
      src: event.imageUrl,
      participationType: event.participationType,
      eventType: event.eventType,
      registrationFee: event.registrationFee || 0,
      prizePool: event.prizePool,
      date: event.date,
      time: event.time,
      event: event,
      qrCode: event.qrCode,
      // isAttended: event.isAttended,
    };
  });

  useOutsideClick(ref as React.RefObject<HTMLDivElement>, () => {
    setActive(null);
  });

  const handleDeleteParticipation = async () => {
    if (!active?.event.id) return;

    try {
      setIsDeletingParticipation(true);
      const response = await fetch("/api/events/delete-participation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          eventId: active.event.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete participation");
      }

      toast.success("Team participation cancelled successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete participation"
      );
    } finally {
      setIsDeletingParticipation(false);
    }
  };

  const renderTeamMembers = (teamMembers?: TeamMember[]) => {
    if (!teamMembers || teamMembers.length === 0) return null;

    // Sort members to ensure team leader is first
    const sortedMembers = [...teamMembers].sort((a, b) =>
      a.isMainParticipant ? -1 : b.isMainParticipant ? 1 : 0
    );

    // Count attended members
    const attendedCount = sortedMembers.filter(member => member.isAttended).length;
    const totalMembers = sortedMembers.length;
    const isPartiallyAttended = attendedCount > 0 && attendedCount < totalMembers;
    const isFullyAttended = attendedCount === totalMembers;

    return (
      <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
        <h4 className="text-neutral-200 font-semibold mb-3">Team Members</h4>
        <div className="space-y-3">
          {sortedMembers.map((member, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    member.imageUrl ||
                    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
                  }
                  alt={member.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <p className="text-neutral-200 text-sm">
                    {member.name} {member.isMainParticipant && "(Team Lead)"}
                  </p>
                  <p className="text-neutral-400 text-xs">{member.sic}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    member.isAttended
                      ? "bg-green-500/20 text-green-400"
                      : member.isConfirmed
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {member.isAttended
                    ? "Attended"
                    : member.isConfirmed
                    ? "Confirmed"
                    : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-2 rounded">
          <p className={`text-sm ${
            isFullyAttended 
              ? "text-green-400" 
              : isPartiallyAttended 
                ? "text-yellow-400" 
                : "text-yellow-400"
          }`}>
            {isFullyAttended 
              ? "All team members have marked attendance" 
              : isPartiallyAttended
                ? `${attendedCount} of ${totalMembers} members have marked attendance`
                : "Attendance pending for all members"}
          </p>
        </div>
      </div>
    );
  };

  const renderEventDetails = (activeCard: (typeof cards)[0]) => {
    const currentUser = activeCard.event.teammates?.find(
      (m) => m.isMainParticipant
    );

    return (
      <div>
        <p className="mb-2">
          <strong>Date:</strong> {activeCard.date}
        </p>
        <p className="mb-2">
          <strong>Time:</strong> {activeCard.time}
        </p>
        <p className="mb-2">
          <strong>Type:</strong> {activeCard.eventType}
        </p>
        <p className="mb-2">
          <strong>Participation:</strong> {activeCard.participationType}
        </p>
        <p className="mb-2">
          <strong>Registration Fee:</strong> ₹{activeCard.registrationFee}
        </p>
        <p className="mb-2">
          <strong>Prize Pool:</strong> ₹{activeCard.prizePool}
        </p>
        {/* <p className="mt-4 mb-4">{activeCard.description}</p> */}
        {renderTeamMembers(activeCard.event.teammates)}
        <div className="mt-4">
          {/* Only show cancel team participation button if user is team leader */}
          {currentUser?.isMainParticipant && (
            <button
              onClick={handleDeleteParticipation}
              disabled={isDeletingParticipation}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingParticipation
                ? "Cancelling participation..."
                : "Cancel Team Participation"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.05 },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-neutral-900 rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-[90vh] md:max-h-[90%] flex flex-col bg-neutral-900 sm:rounded-3xl overflow-auto no-visible-scrollbar"
            >
              {active.event.eventType === "CULTURAL" ? (
                <div className="flex justify-center items-center p-8 bg-white">
                  <Image
                    src={active.src}
                    alt={active.title}
                    width={400}
                    height={400}
                    className="object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center p-8 bg-white">
                  <QRCode value={active.qrCode} />
                </div>
              )}

              <div>
                <div className="flex justify-between items-start p-4 gap-8">
                  <div className="flex-1">
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-bold text-neutral-200 mb-2"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-neutral-400"
                    >
                      {active.description}
                    </motion.p>
                  </div>
                </div>

                <div className="pt-4 relative px-4 pb-6">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-400 text-xs md:text-sm lg:text-base max-h-[60vh] overflow-auto dark:text-neutral-400 no-visible-scrollbar"
                  >
                    {renderEventDetails(active)}
                    <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
                      <p
                        className={`${
                           (active.event.teammates && active.event.teammates.every(member => member.isAttended))
                            ? "text-green-400"
                            : active.event.teammates && active.event.teammates.some(member => member.isAttended)
                              ? "text-yellow-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {(active.event.teammates && active.event.teammates.every(member => member.isAttended))
                          ? "Attendance Marked"
                          : active.event.teammates && active.event.teammates.some(member => member.isAttended)
                            ? "Attendance Marked Partially"
                            : "Attendance Pending"}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <ul className="mx-auto w-full gap-4">
        {cards.map((card, index) => (
          <motion.div
            layoutId={`card-${card.title}-${id}-${index}`}
            key={index}
            onClick={() => setActive(card)}
            className="py-4 md:p-4 flex flex-col md:flex-row justify-between items-center rounded-xl hover:bg-neutral-800 cursor-pointer"
          >
            <div className="flex gap-4 flex-col md:flex-row md:w-[80%]">
              <motion.div
                layoutId={`image-${card.title}-${id}-${index}`}
                className="flex items-center justify-center"
              >
                <Image
                  width={100}
                  height={100}
                  src={card.src}
                  alt={card.title}
                  className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                />
              </motion.div>
              <div className="w-full">
                <motion.h3
                  layoutId={`title-${card.title}-${id}-${index}`}
                  className="font-medium text-neutral-200 text-center md:text-left"
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.description}-${id}-${index}`}
                  className="text-neutral-400 text-center md:text-left"
                >
                  {card.description.substring(0,150)}
                </motion.p>
                {card.event.teammates && card.event.teammates.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {card.event.teammates.slice(0, 3).map((member, idx) => (
                        <Image
                          key={idx}
                          src={
                            member.imageUrl ||
                            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
                          }
                          alt={member.name}
                          width={24}
                          height={24}
                          className="rounded-full border-2 border-neutral-800"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-neutral-400">
                      {card.event.teammates.length} team member
                      {card.event.teammates.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.title}-${id}-${index}`}
              className="px-4 py-2 w-32 text-sm rounded-full font-bold mt-4 md:mt-0 bg-gray-100 hover:bg-blue-500 hover:text-white text-black"
              onClick={(e) => {
                e.stopPropagation();
                setActive(card);
              }}
            >
              Show QR
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </>
  );
}

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.05 },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-white"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

export default QRCard;
