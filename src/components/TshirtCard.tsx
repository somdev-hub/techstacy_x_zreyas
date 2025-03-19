"use client";

import Image from "next/image";
import React, { useEffect, useRef } from "react";

interface TshirtCardProps {
  info: {
    title?: string;
    description?: string;
    src?: string;
    mainButton?: {
      type: string;
      text: string;
      onClick: () => void;
      razorpay?: boolean;
      paymentButtonId?: string;
    };
  } | null;
}

export function TshirtCard({ info }: TshirtCardProps) {
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

  const handleMainButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    info?.mainButton?.onClick?.();
  };

  return (
    <div className="bg-neutral-800 border border-white/[0.2] rounded-xl p-6 h-full">
      <h2 className="text-xl font-bold text-white mb-2">
        {info?.title || "T-shirt Order"}
      </h2>
      <p className="text-neutral-300 text-sm mb-4">
        {
          "A brillient combination of tech and style, get your hands on this exclusive t-shirt now! Order now to match the vibe of the event."
        }
      </p>

      <div className="w-full mb-6">
        <Image
          src={info?.src || "/assets/tshirt.png"}
          height="1000"
          width="1000"
          className="h-60 w-full object-cover rounded-xl"
          alt="T-shirt"
        />
      </div>

      {/* <div className="flex justify-center">
        {info?.mainButton?.razorpay ? (
          <div ref={razorpayFormRef} className="w-full flex justify-center"></div>
        ) : (
          <button
            onClick={handleMainButtonClick}
            className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            {info?.mainButton?.text || "Order Now"}
          </button>
        )}
      </div> */}

      <div className="">
        <p className="text-center text-red-600 font-[600]">
          T-shirt registrations are closed for now. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}
