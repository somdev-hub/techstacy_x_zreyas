import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/context/ModalContext";
import { Modal } from "@/components/Modal";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { LoginModal } from "@/components/LoginModal";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/context/UserContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Techstacy X Zreyas",
  description:
    "The annual tech and cultural fest of Silicon Institute of Technology, Sambalpur",
  manifest: "/manifest.json",
  // themeColor: "#171717",
  openGraph: {
    title: "Techstacy X Zreyas",
    description:
      "The annual tech and cultural fest of Silicon Institute of Technology, Sambalpur",
    type: "website",
    locale: "en_US",
    siteName: "Techstacy X Zreyas",
    url: "https://techstacy-x-zreyas.sitwestevents.live",
    images: [
      {
        url: "https://beautiful-gold-bison.myfilebase.com/ipfs/QmfPJbxqWWXrY88upm6A32QPa923uerRRvQofpyMpH6anW",
        width: 500,
        height: 300,
        alt: "Techstacy X Zreyas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Techstacy X Zreyas",
    description:
      "The annual tech and cultural fest of Silicon Institute of Technology, Sambalpur",
    images: [
      "https://beautiful-gold-bison.myfilebase.com/ipfs/QmY6ZTZD3aFKSrQpcELKKvAaKEcT6ur78AHDNHnbvASggi",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Techstacy X Zreyas" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased has-modal:overflow-hidden has-modal:fixed has-modal:w-full has-modal:h-full`}
        suppressHydrationWarning
      >
        <UserProvider>
          <NotificationProvider>
            <LoginModalProvider>
              <ModalProvider>
                {children}
                <Modal />
                <LoginModal />
              </ModalProvider>
            </LoginModalProvider>
          </NotificationProvider>
        </UserProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
