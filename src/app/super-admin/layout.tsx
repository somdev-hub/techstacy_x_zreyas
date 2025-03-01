"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconMenu2,
} from "@tabler/icons-react";
import Image from "next/image";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Sidebar";
import { GiPartyPopper } from "react-icons/gi";
import { BiPurchaseTagAlt } from "react-icons/bi";
import { usePathname } from "next/navigation";
import UserProfileModal from "@/components/UserProfileModal";
import { FaBell } from "react-icons/fa";
import Notification from "@/components/Notification";

// Default user data
const defaultUserInfo = {
  name: "User",
  email: "user@example.com",
  phone: "",
  college: "",
  sic: "",
  year: "",
  imageUrl: "https://assets.aceternity.com/avatars/default.png",
  eventParticipation: 0,
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState(defaultUserInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const notifications = [
    {
      id: 1,
      title: "New Event Registration",
      message: "You have successfully registered for Hackathon 2023",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      title: "Event Reminder",
      message: "Technical Workshop starts in 3 hours",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 3,
      title: "Registration Deadline",
      message: "Last day to register for Coding Competition",
      time: "1 day ago",
      read: true,
    },
  ];

  const logoutHandler = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      toast.success(data.message);
    }
    router.push("/");
  };

  const links = [
    {
      label: "Dashboard",
      href: "/super-admin/home",
      icon: (
        <IconBrandTabler className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Attendance",
      href: "/super-admin/attendance",
      icon: (
        <GiPartyPopper className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Payments",
      href: "/super-admin/payments",
      icon: (
        <BiPurchaseTagAlt className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Results",
      href: "/super-admin/results",
      icon: (
        <IconSettings className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Logout",
      href: "/",
      icon: (
        <IconArrowLeft className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        logoutHandler();
      },
    },
  ];

  const toggleProfileModal = () => {
    setOpen(false);
    setIsProfileModalOpen(!isProfileModalOpen);
  };

  // Add authentication check and data fetching
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });

        if (!response.ok) {
          // If not authenticated, redirect immediately
          router.replace("/");
          return;
        }

        const userData = await response.json();

        // Check if user is SUPERADMIN
        if (userData.role === "ADMIN") {
          toast.error("Please use the Admin dashboard");
          router.replace("/admin/home");
          return;
        } else if (userData.role === "USER") {
          toast.error("Please use the regular dashboard");
          router.replace("/dashboard/home");
          return;
        } else if (userData.role !== "SUPERADMIN") {
          toast.error("Unauthorized access");
          router.replace("/");
          return;
        }

        setUser(userData);
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        console.error("Error fetching user data:", error);
        setError(error.message);
        toast.error("Failed to load user data");
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Token refresh logic
    const refreshToken = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/");
          toast.error("Session expired. Please log in again.");
        }
      } catch (error) {
        console.error("Token refresh error:", error);
      }
    };

    refreshToken();
    const refreshInterval = setInterval(refreshToken, 14 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [router]);

  // Modify the return statement to handle loading and error states
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-800">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-neutral-700 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 flex text-white h-[100dvh] overflow-hidden">
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="hidden lg:block">
              {open ? <Logo /> : <LogoIcon />}
            </div>
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={`group text-lg font-medium transition-all duration-200 hover:bg-neutral-700/50 rounded-lg ${
                    pathname === link.href ? "bg-neutral-700 " : ""
                  }`}
                />
              ))}
            </div>
          </div>
          <div onClick={toggleProfileModal}>
            <SidebarLink
              link={{
                label: defaultUserInfo.name,
                href: "#",
                icon: (
                  <Image
                    src={defaultUserInfo.imageUrl}
                    className="h-8 w-8 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
              className="hover:bg-neutral-700/50 rounded-lg text-lg font-medium cursor-pointer"
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-neutral-900 overflow-y-scroll no-visible-scrollbar pt-3 md:pt-6 w-full px-2 md:px-8 my-2 mr-2 rounded-2xl pb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setOpen(true)}
                className=" p-2 text-white lg:hidden"
              >
                <IconMenu2 className="h-6 w-6" />
              </button>
              <div className="">
                <h1 className="text-[1.5rem] font-[700]">Dashboard</h1>
                <p className="text-[1.25rem] hidden sm:block">
                  Welcome to your dashboard
                </p>
              </div>
            </div>
            <div
              className="bg-neutral-800 p-4 rounded-xl shadow-md cursor-pointer hover:bg-neutral-700 relative mr-2 md:mr-0"
              onClick={toggleModal}
            >
              <FaBell className="text-2xl" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </div>
          </div>

          {/* Notification Modal */}
          {isModalOpen && (
            <>
              <Notification toggleModal={toggleModal} />
            </>
          )}
          {children}
        </div>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={toggleProfileModal}
        userInfo={defaultUserInfo}
      />
    </div>
  );
}
