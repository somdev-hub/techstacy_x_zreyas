import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ModalProvider } from "@/context/ModalContext";
import { Modal } from "@/components/Modal";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { LoginModal } from "@/components/LoginModal";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Zreyas X Techstacy",
  description: "Zreyas X Techstacy 2024"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <LoginModalProvider>
          <ModalProvider>
            {children}
            <Modal />
            <LoginModal />
          </ModalProvider>
        </LoginModalProvider>
        <Toaster />
      </body>
    </html>
  );
}
