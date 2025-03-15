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
        url: "https://beautiful-gold-bison.myfilebase.com/ipfs/QmWPGCxoQZXPuAwf386kJMsZKMp8A6Gsi8AG9AkQXESsFV",
        width: 1200,
        height: 630,
        alt: "Techstacy X Zreyas",
        type: "image/jpeg",
      },
      {
        url: "https://beautiful-gold-bison.myfilebase.com/ipfs/QmY6ZTZD3aFKSrQpcELKKvAaKEcT6ur78AHDNHnbvASggi",
        width: 1200,
        height: 630,
        alt: "Techstacy X Zreyas",
        type: "image/png",
      },
      {
        url: "https://beautiful-gold-bison.myfilebase.com/ipfs/Qme5iGCHx93c6kJvi9QYF57y4xXVum4k4FQR46JkwB25GW",
        width: 600,
        height: 600,
        alt: "Techstacy X Zreyas",
        type: "image/png",
      },
      {
        url: "https://beautiful-gold-bison.myfilebase.com/ipfs/QmWwCG2jQeG9n4UNyJ2X9B74aGuSSejusMzzuKqcMNW9Wt",
        width: 1200,
        height: 630,
        alt: "Techstacy X Zreyas",
        type: "image/png",
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
