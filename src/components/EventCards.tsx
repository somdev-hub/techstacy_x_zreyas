"use client";
import Image from "next/image";
import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Events, ParticipationType, EventType } from "@prisma/client";

interface EventCardProps {
  cardData: {
    id: number;
    title: string;
    date: string;
    time: string;
    desc: string;
    image: string;
    key: Events;
    participationType: ParticipationType;
    eventType: EventType;
    registrationFee: number;
    prizePool: number;
  }[];
}

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  sic?: string;
}

export function EventCard({ cardData }: EventCardProps) {
  const [active, setActive] = useState<(typeof cards)[number] | boolean | null>(
    null
  );
  const [showForm, setShowForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<
    UserSearchResult[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  // Create cards with event data - moved up to fix reference before definition
  const cards = cardData.map((event) => ({
    description: event.desc,
    title: event.title,
    src: event.image,
    ctaText: "Register",
    ctaLink: "#",
    participationType: event.participationType,
    eventType: event.eventType,
    registrationFee: event.registrationFee,
    prizePool: event.prizePool,
    date: event.date,
    time: event.time,
    event: event // Store the full event data
  }));

  // Mock search function - in a real app, this would call your API
  const searchUsers = async (query: string) => {
    setIsLoading(true);
    // Simulate API delay
    // await new Promise((resolve) => setTimeout(resolve, 500));

    // // Mock search results
    // const mockResults: UserSearchResult[] = [
    //   { id: "1", name: "John Doe", email: "john@example.com", sic: "SIC001" },
    //   { id: "2", name: "Jane Smith", email: "jane@example.com", sic: "SIC002" },
    //   { id: "3", name: "Bob Johnson", email: "bob@example.com", sic: "SIC003" },
    //   {
    //     id: "4",
    //     name: "Alice Williams",
    //     email: "alice@example.com",
    //     sic: "SIC004"
    //   },
    //   {
    //     id: "5",
    //     name: "Charlie Brown",
    //     email: "charlie@example.com",
    //     sic: "SIC005"
    //   }
    // ].filter(
    //   (user) =>
    //     user.name.toLowerCase().includes(query.toLowerCase()) ||
    //     user.sic?.toLowerCase().includes(query.toLowerCase())
    // );

    // setSearchResults(mockResults);
    // setIsLoading(false);

    try {
      const response = await fetch(`/api/user/search?query=${query}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If it's a solo event, register immediately
    if (
      active &&
      typeof active === "object" &&
      active.participationType === ParticipationType.SOLO
    ) {
      handleSoloRegistration();
    } else {
      // For team events, show form
      setShowForm(true);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedParticipants([]);
    }
  };

  const handleSoloRegistration = () => {
    // In a real app, you would call your API to register the user
    alert("You have been registered successfully!");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Only search if there are at least 2 characters
    if (query.length >= 2) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  const selectParticipant = (participant: UserSearchResult) => {
    // Check if this participant is already selected
    if (selectedParticipants.some((p) => p.id === participant.id)) {
      return;
    }

    setSelectedParticipants([...selectedParticipants, participant]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeParticipant = (participantId: string) => {
    setSelectedParticipants(
      selectedParticipants.filter((p) => p.id !== participantId)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (active && typeof active === "object") {
      // Validate based on participation type
      if (
        active.participationType === ParticipationType.DUO &&
        selectedParticipants.length !== 2
      ) {
        alert("Please select exactly 2 participants for duo events.");
        return;
      } else if (
        active.participationType === ParticipationType.QUAD &&
        selectedParticipants.length !== 4
      ) {
        alert("Please select exactly 4 participants for quad events.");
        return;
      } else if (
        active.participationType === ParticipationType.QUINTET &&
        selectedParticipants.length !== 5
      ) {
        alert("Please select exactly 5 participants for quintet events.");
        return;
      } else if (
        active.participationType === ParticipationType.GROUP &&
        selectedParticipants.length < 2
      ) {
        alert("Please select at least 2 participants for group events.");
        return;
      }
    }

    // In a real app, you would call your API to register the team
    console.log("Registering team:", selectedParticipants);
    alert("Team registered successfully!");
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedParticipants([]);
  };

  useEffect(() => {
    // Reset form when modal closes
    if (!active) {
      resetForm();
    }
  }, [active]);

  useOutsideClick(ref as React.RefObject<HTMLDivElement>, () => {
    setActive(null);
    resetForm();
  });

  const renderEventDetails = (activeCard: (typeof cards)[0]) => {
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
        <p className="mt-4 mb-4">{activeCard.description}</p>
      </div>
    );
  };

  const getParticipationTypeRequirement = (type: ParticipationType) => {
    switch (type) {
      case ParticipationType.DUO:
        return "2 participants";
      case ParticipationType.QUAD:
        return "4 participants";
      case ParticipationType.QUINTET:
        return "5 participants";
      case ParticipationType.GROUP:
        return "2 or more participants";
      default:
        return "";
    }
  };

  const renderRegistrationForm = (activeCard: (typeof cards)[0]) => {
    // Don't show form for solo events
    if (activeCard.participationType === ParticipationType.SOLO) {
      return null;
    }

    const requirementText = getParticipationTypeRequirement(
      activeCard.participationType
    );

    return (
      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-neutral-800 p-4 rounded-lg"
      >
        <h4 className="font-semibold text-lg mb-2 text-white">
          Team Registration
        </h4>
        <p className="text-sm text-neutral-300 mb-4">
          This event requires {requirementText}.
        </p>

        <div className="mb-4">
          <label className="block text-sm text-neutral-300 mb-1">
            Search participants by name or SIC
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Type to search..."
              className="w-full px-3 py-2 bg-neutral-700 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {isLoading && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-neutral-700 rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-2 hover:bg-neutral-600 cursor-pointer border-b border-neutral-600 flex justify-between items-center"
                  onClick={() => selectParticipant(result)}
                >
                  <div>
                    <p className="text-white">{result.name}</p>
                    <p className="text-xs text-neutral-400">
                      {result.sic} - {result.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded-md"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected participants */}
        {selectedParticipants.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-neutral-300 mb-2">
              Selected Participants ({selectedParticipants.length}/
              {activeCard.participationType === ParticipationType.GROUP
                ? "2+"
                : activeCard.participationType === ParticipationType.DUO
                ? "2"
                : activeCard.participationType === ParticipationType.QUAD
                ? "4"
                : "5"}
              )
            </h5>
            <div className="space-y-2">
              {selectedParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex justify-between items-center bg-neutral-700 p-2 rounded-md"
                >
                  <div>
                    <p className="text-white text-sm">{participant.name}</p>
                    <p className="text-xs text-neutral-400">
                      {participant.sic}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeParticipant(participant.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Register Team
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05
                }
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-neutral-900 rounded-full h-6 w-6"
              onClick={() => {
                setActive(null);
                resetForm();
              }}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-[90vh] md:max-h-[90%] flex flex-col bg-neutral-900 sm:rounded-3xl overflow-auto no-visible-scrollbar"
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <Image
                  priority
                  width={200}
                  height={200}
                  src={active.src}
                  alt={active.title}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
              </motion.div>

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

                  {!showForm && (
                    <motion.button
                      layoutId={`button-${active.title}-${id}`}
                      onClick={handleRegisterClick}
                      className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white hover:bg-green-600 whitespace-nowrap"
                    >
                      {active.participationType === ParticipationType.SOLO
                        ? "Register Now"
                        : "Create Team"}
                    </motion.button>
                  )}
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

                    {showForm && renderRegistrationForm(active)}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="mx-auto w-full gap-4">
        {cards.map((card) => (
          <motion.div
            layoutId={`card-${card.title}-${id}`}
            key={`card-${card.title}-${id}`}
            onClick={() => {
              setActive(card);
              resetForm();
            }}
            className="py-4 md:p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <div className="flex gap-4 flex-col md:flex-row md:w-[80%]">
              <motion.div
                layoutId={`image-${card.title}-${id}`}
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
              <div className="">
                <motion.h3
                  layoutId={`title-${card.title}-${id}`}
                  className="font-medium text-neutral-200 text-center md:text-left"
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card.description}-${id}`}
                  className="text-neutral-400 text-center md:text-left"
                >
                  {card.description}
                </motion.p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${card.title}-${id}`}
              className="px-4 py-2 w-32 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black mt-4 md:mt-0"
              onClick={(e) => {
                e.stopPropagation();
                setActive(card);
                resetForm();
              }}
            >
              {card.participationType === ParticipationType.SOLO
                ? "Register"
                : "Create Team"}
            </motion.button>
          </motion.div>
        ))}
      </ul>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05
        }
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

export default EventCard;
