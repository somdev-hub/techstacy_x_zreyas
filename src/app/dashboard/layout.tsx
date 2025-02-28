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
import { FaBell, FaTimes } from "react-icons/fa";

// Default user data as fallback
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(defaultUserInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/me", {
          credentials: "include",
        });

        if (!response.ok) {
          // If not authenticated, redirect immediately
          router.replace("/");
          return;
        }

        const result = await response.json();
        
        // Check user role and redirect if needed
        if (result.role === "SUPERADMIN") {
          toast.error("Please use the Super Admin dashboard");
          router.replace("/super-admin/home");
          return;
        } else if (result.role === "ADMIN") {
          toast.error("Please use the Admin dashboard");
          router.replace("/admin/home");
          return;
        }

        setUser({
          ...result
        });
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        console.error("Error fetching user data:", error);
        setError(error.message);
        toast.error("Failed to load user data");
        // Redirect to login on any error
        router.replace("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Set up token refresh logic
    const refreshToken = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          router.replace("/");
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

  const logoutHandler = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      toast.success("Logged out successfully");
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  // Let's add some debug logging to check the user data
  useEffect(() => {
    if (!isLoading && user) {
      console.log("User data available for modal:", user);
    }
  }, [isLoading, user]);

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard/home",
      icon: (
        <IconBrandTabler className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Zreyas",
      href: "/dashboard/zreyas",
      icon: (
        <GiPartyPopper className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Purchases",
      href: "/dashboard/purchases",
      icon: (
        <BiPurchaseTagAlt className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Results",
      href: "/dashboard/results",
      icon: (
        <IconSettings className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Logout",
      href: "#",
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

  return (
    <div className="bg-neutral-800 flex text-white h-[100dvh] overflow-hidden">
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Show different logos based on screen size and sidebar state */}
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
                label: isLoading ? "Loading..." : user.name,
                href: "#",
                icon: (
                  <Image
                    src={
                      user.imageUrl ||
                      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"
                    }
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
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">Error loading dashboard data</p>
              <button
                onClick={() => router.refresh()}
                className="px-4 py-2 bg-neutral-700 rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
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
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
                  onClick={toggleModal}
                />
                <div className="fixed top-24 right-2 left-2 md:right-8 md:w-96 bg-neutral-800 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Notifications</h2>
                    <button
                      onClick={toggleModal}
                      className="hover:bg-neutral-700 p-2 rounded-full"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-neutral-400">
                        No notifications
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer ${
                            !notification.read
                              ? "bg-neutral-700 bg-opacity-40"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold">
                              {notification.title}
                            </h3>
                            <span className="text-xs text-neutral-400">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-300 mt-1">
                            {notification.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-neutral-700">
                    <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300">
                      Mark all as read
                    </button>
                  </div>
                </div>
              </>
            )}
            {children}
          </div>
        )}
      </div>

      {/* User Profile Modal - ensure userInfo prop is valid even if user data is not fully loaded */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={toggleProfileModal}
        userInfo={{
          name: user?.name || "User",
          email: user?.email || "user@example.com",
          phone: user?.phone || "",
          college: user?.college || "",
          sic: user?.sic || "",
          year: user?.year || "",
          imageUrl:
            user?.imageUrl ||
            "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541",
          eventParticipation: user?.eventParticipation || 0,
        }}
      />
    </div>
  );
}
