"use client";
import Image from "next/image";
import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Events, ParticipationType, EventType } from "@prisma/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

interface AdminEventCardProps {
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
    prizePool: number;
    venue: string;
  }[];
}

const eventFormSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  eventName: z.nativeEnum(Events, {
    required_error: "Please select an event",
  }),
  prizePool: z.string().min(1, "Please enter a prize pool"),
  venue: z.string().min(1, "Please enter a venue"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.string().min(1, "Please enter a date"),
  time: z.string().min(1, "Please enter a time"),
  eventType: z.nativeEnum(EventType, {
    required_error: "Please select an event type",
  }),
  participationType: z.nativeEnum(ParticipationType, {
    required_error: "Please select a participation type",
  }),
  image: z.any().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export function AdminEventCard({ cardData }: AdminEventCardProps) {
  type CardType = {
    id: number;
    description: string;
    title: string;
    src: string;
    participationType: ParticipationType;
    eventType: EventType;
    prizePool: number;
    date: string;
    time: string;
    venue: string;
    eventName: Events;
  };
  
  const [active, setActive] = useState<CardType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
  });

  const cards = cardData.map((event) => ({
    id: event?.id,
    description: event?.desc,
    title: event?.title,
    src: event?.image,
    participationType: event?.participationType,
    eventType: event?.eventType,
    prizePool: event?.prizePool,
    date: event?.date,
    time: event?.time,
    venue: event?.venue,
    eventName: event?.key,
  }));

  useEffect(() => {
    if (active && isEditing) {
      setValue("name", active.title);
      setValue("eventName", active.eventName);
      setValue("prizePool", active.prizePool.toString());
      setValue("description", active.description);
      setValue("venue", active.venue);
      setValue("date", active.date);
      setValue("time", active.time);
      setValue("eventType", active.eventType);
      setValue("participationType", active.participationType);
    }
  }, [active, isEditing, setValue]);

  const onSubmit = async (data: EventFormValues) => {
    if (!active) return;
    
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "image" && value?.[0]) {
          formData.append("imageUrl", value[0]); // Changed from 'image' to 'imageUrl' to match schema
        } else if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      formData.append("id", active.id.toString());

      const response = await fetch(`/api/events/${active.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      toast.success("Event updated successfully");
      setIsEditing(false);
      // Here you might want to refresh the events data by calling window.location.reload()
      window.location.reload();
    } catch (error) {
      console.error("Failed to update event:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update event"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useOutsideClick(ref as React.RefObject<HTMLDivElement>, () => {
    setActive(null);
    setIsEditing(false);
  });

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const renderEditForm = () => {
    if (!active) return null;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Event Name"
              {...register("name")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <select
              {...register("eventName")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            >
              <option value="">Select Event</option>
              {Object.values(Events).map((event) => (
                <option key={event} value={event}>
                  {event.replace("_", " ")}
                </option>
              ))}
            </select>
            {errors.eventName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.eventName.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Prize Pool"
              {...register("prizePool")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            />
            {errors.prizePool && (
              <p className="text-red-500 text-sm mt-1">
                {errors.prizePool.message}
              </p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Venue"
              {...register("venue")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            />
            {errors.venue && (
              <p className="text-red-500 text-sm mt-1">
                {errors.venue.message}
              </p>
            )}
          </div>
        </div>

        <textarea
          placeholder="Description"
          {...register("description")}
          className="bg-neutral-700 rounded-md px-3 py-2 w-full min-h-[100px]"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="date"
              {...register("date")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
          <div>
            <input
              type="time"
              {...register("time")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            />
            {errors.time && (
              <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <select
              {...register("eventType")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            >
              <option value="">Select Type</option>
              {Object.values(EventType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.eventType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.eventType.message}
              </p>
            )}
          </div>
          <div>
            <select
              {...register("participationType")}
              className="bg-neutral-700 rounded-md px-3 py-2 h-10 w-full"
            >
              <option value="">Select Participation Type</option>
              {Object.values(ParticipationType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.participationType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.participationType.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center h-10 bg-neutral-700 rounded-md px-3 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              {...register("image")}
              className="w-full text-sm text-white appearance-none file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-white file:bg-blue-600 hover:file:bg-blue-700 file:cursor-pointer focus:outline-none file:h-7 h-7"
            />
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 px-4 py-2 rounded-md text-white disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Event"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="bg-neutral-600 px-4 py-2 rounded-md text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

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
          <strong>Venue:</strong> {activeCard.venue}
        </p>
        <p className="mb-2">
          <strong>Type:</strong> {activeCard.eventType}
        </p>
        <p className="mb-2">
          <strong>Participation:</strong> {activeCard.participationType}
        </p>
        <p className="mb-2">
          <strong>Prize Pool:</strong> ₹{activeCard.prizePool}
        </p>
        <p className="mt-4 mb-4">{activeCard.description}</p>
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
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-neutral-900 rounded-full h-6 w-6"
              onClick={() => {
                setActive(null);
                setIsEditing(false);
              }}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[600px] h-full md:h-[90vh] md:max-h-[90%] flex flex-col bg-neutral-900 sm:rounded-3xl overflow-auto no-visible-scrollbar"
            >
              <motion.div
                layoutId={`image-${active.title}-${id}`}
                className="relative"
              >
                <Image
                  priority
                  width={200}
                  height={200}
                  src={active.src || '/assets/tshirt.png'} // Provide default image
                  alt={active.title || 'Event Image'}
                  className="w-full h-80 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="absolute top-4 right-4 bg-blue-600 px-4 py-2 rounded-md text-white"
                  >
                    Edit Event
                  </button>
                )}
              </motion.div>

              <div className="p-6">
                <div className="flex justify-between items-start gap-8 mb-4">
                  <motion.h3
                    layoutId={`title-${active.title}-${id}`}
                    className="text-2xl font-bold text-white"
                  >
                    {active.title}
                  </motion.h3>
                </div>

                {isEditing ? renderEditForm() : renderEventDetails(active)}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="mx-auto w-full gap-4">
        {cards.map((card, index) => (
          <motion.div
            layoutId={`card-${card?.title}-${id}`}
            key={index}
            onClick={() => {
              setActive(card);
              setIsEditing(false);
            }}
            className="py-4 md:p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <div className="flex gap-4 flex-col md:flex-row md:w-[80%]">
              <motion.div
                layoutId={`image-${card?.title}-${id}`}
                className="flex items-center justify-center"
              >
                <Image
                  width={100}
                  height={100}
                  src={card?.src || '/assets/tshirt.png'} // Provide default image
                  alt={card?.title || 'Event Image'}
                  className="h-40 w-40 md:h-14 md:w-14 rounded-lg object-cover object-top"
                />
              </motion.div>
              <div>
                <motion.h3
                  layoutId={`title-${card?.title}-${id}`}
                  className="font-medium text-neutral-200 text-center md:text-left"
                >
                  {card?.title}
                </motion.h3>
                <motion.p
                  layoutId={`description-${card?.description}-${id}`}
                  className="text-neutral-400 text-center md:text-left"
                >
                  {card?.description}
                </motion.p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <motion.button
                layoutId={`edit-${card?.title}-${id}`}
                className="px-4 py-2 w-32 text-sm rounded-full font-bold bg-blue-600 text-white hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(card);
                  setIsEditing(true);
                }}
              >
                Edit
              </motion.button>
            </div>
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
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
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

export default AdminEventCard;
