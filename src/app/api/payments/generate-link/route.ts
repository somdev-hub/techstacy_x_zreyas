import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const {
      amount,
      currency = "INR",
      description,
      customer,
    } = await req.json();

    const paymentLinkRequest = {
      amount: amount * 100, // Convert to smallest currency unit (paise)
      currency,
      accept_partial: false,
      description,
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      reference_id: uuidv4(),
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
      callback_method: "get",
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkRequest);

    return NextResponse.json({
      success: true,
      data: paymentLink,
    });
  } catch (error) {
    console.error("Payment link generation failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payment link" },
      { status: 500 }
    );
  }
}
