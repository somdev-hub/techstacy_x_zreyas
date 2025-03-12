"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { CardBody, CardContainer, CardItem } from "./ui/3d-card";
import Link from "next/link";
import { EventCard } from "./EventCards";
import { EventType, Events, ParticipationType } from "@prisma/client";

// Define a proper type for the event object
interface EventData {
  id: number;
  name: string;
  date: string;
  time: string;
  description: string;
  imageUrl: string;
  eventName: string;
  participationType: string;
  eventType: EventType;
  registrationFee: number;
  prizePool: number;
  partialRegistration: boolean;
}

interface ThreeDCardProps {
  info: {
    title?: string;
    description?: string;
    src?: string;
    event?: EventData;
    mainButton?: {
      type: string;
      text: string;
      onClick: () => void;
      razorpay?: boolean;
      paymentButtonId?: string;
    };
  } | null;
  isEvent?: boolean;
}

export function ThreeDCard({ info, isEvent = false }: ThreeDCardProps) {
  const [showEventModal, setShowEventModal] = useState(false);
  const razorpayFormRef = useRef<HTMLDivElement>(null);

  // Effect to load Razorpay script when needed
  useEffect(() => {
    if (
      info?.mainButton?.razorpay &&
      info?.mainButton?.paymentButtonId &&
      razorpayFormRef.current
    ) {
      // Clear any existing scripts
      while (razorpayFormRef.current.firstChild) {
        razorpayFormRef.current.removeChild(razorpayFormRef.current.firstChild);
      }

      // Create form and script elements
      const form = document.createElement("form");
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/payment-button.js";
      script.setAttribute(
        "data-payment_button_id",
        info.mainButton.paymentButtonId
      );
      script.async = true;

      form.appendChild(script);
      razorpayFormRef.current.appendChild(form);
    }
  }, [info?.mainButton?.razorpay, info?.mainButton?.paymentButtonId]);

  if (!info) return null;

  const handleEventClick = () => {
    if (isEvent && info.event) {
      setShowEventModal(true);
    }
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event modal from opening
    info?.mainButton?.onClick?.();
  };

  return (
    <>
      {/* Wrap with a div that has the onClick handler */}
      <div
        onClick={isEvent ? handleEventClick : undefined}
        className="cursor-pointer"
      >
        <CardContainer className="inter-var">
          <CardBody className="bg-neutral-800 relative group/card hover:shadow-2xl hover:shadow-emerald-500/[0.1] border-white/[0.2] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
            <CardItem translateZ="50" className="text-xl font-bold text-white">
              {info?.title ? info?.title : " Make things float in air"}
            </CardItem>
            <CardItem
              as="p"
              translateZ="60"
              className="text-neutral-300 text-sm max-w-sm mt-2"
            >
              {info?.description
                ? info?.description
                : "Hover over this card to unleash the power of CSS perspective"}
            </CardItem>
            <CardItem translateZ="100" className="w-full mt-4">
              <Image
                src={
                  info?.src
                    ? info?.src
                    : "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                }
                height="1000"
                width="1000"
                className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                alt="thumbnail"
              />
            </CardItem>
            {!isEvent ? (
              <div className="flex flex-col gap-4 mt-8">
                <div className="flex justify-between items-center">
                  {info.mainButton?.razorpay ? (
                    <CardItem
                      translateZ={20}
                      className="w-full flex justify-center"
                    >
                      <div
                        ref={razorpayFormRef}
                        className="w-full flex justify-center"
                      ></div>
                    </CardItem>
                  ) : (
                    <>
                      <CardItem
                        translateZ={20}
                        as={Link}
                        href="#"
                        className="px-4 py-2 rounded-xl text-xs font-normal text-white"
                      >
                        Try now →
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="button"
                        onClick={handleMainButtonClick}
                        className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
                      >
                        {info.mainButton?.text || "Sign up"}
                      </CardItem>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center mt-16">
                <CardItem
                  translateZ={20}
                  as="button"
                  className="px-4 py-2 rounded-xl text-xs font-normal bg-green-600 text-white hover:bg-green-700"
                >
                  View Details
                </CardItem>
                <CardItem
                  translateZ={20}
                  as="button"
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-gray-100"
                >
                  Register Now
                </CardItem>
              </div>
            )}
          </CardBody>
        </CardContainer>
      </div>

      {showEventModal && isEvent && info.event && (
        <EventCard
          cardData={[info.event]}
          isModal={true}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </>
  );
}
