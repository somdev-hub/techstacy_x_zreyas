import Image from "next/image";
import React, { useEffect, useRef } from "react";

const TshirtSection = () => {
  const razorpayFormRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (razorpayFormRef.current) {
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
        process.env.NEXT_PUBLIC_RAZORPAY_TSHIRT_BUTTON_ID || ""
      );
      script.async = true;

      form.appendChild(script);
      razorpayFormRef.current.appendChild(form);
    }
  }, []);
  return (
    <div className="py-20 xl:px-[8rem] px-4">
      <div className=" bg-slate-900 p-6 md:p-12 rounded-lg shadow-lg">
        <div className="flex justify-between items-center flex-col md:flex-row gap-10">
          <div className="md:w-3/5">
            <h2 className="text-4xl font-bold text-white mb-4">
              Get Your Techstacy T-Shirt
            </h2>
            <p className="text-gray-400 mb-4">
              Get your hands on the limited edition Techstacy X Zreyas T-shirt.
              Wear it with pride and show your support for the tech fest. This
              year&apos;s design is inspired by the theme op &quot;Innovate and
              Inspire&quot;. The T-shirt features a unique design that showcases
              the spirit of innovation and creativity. Made from high-quality
              cotton, the T-shirt is comfortable to wear and easy to maintain.
              Available in a range of sizes, the T-shirt is perfect for tech
              enthusiasts of all ages. Order yours today and be a part of the
              Techstacy X Zreyas experience.{" "}
            </p>
            {/* <div ref={razorpayFormRef} className="w-full flex justify-start">
             
            </div> */}
            <div className="">
              <p className="text-red-600 font-[600]">
                T-shirt registrations are closed for now. Stay tuned for
                updates!
              </p>
            </div>
          </div>
          <div className="items-center flex md:w-2/5">
            <Image
              src={"/assets/tshirt.png"}
              alt="Tshirt"
              width={500}
              height={500}
              layout="fixed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TshirtSection;
