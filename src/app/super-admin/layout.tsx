"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBrandTabler,
  IconMenu2,
  IconClipboardCheck,
  IconUserPlus,
  IconCalendarEvent,
  IconCreditCard,
  IconTrophy,
  IconLogout,
} from "@tabler/icons-react";
import Image from "next/image";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import UserProfileModal from "@/components/UserProfileModal";
import { FaBell } from "react-icons/fa";
import Notification from "@/components/Notification";
import { useUser } from "@/context/UserContext";
import { useNotifications } from "@/context/NotificationContext";
import { Events, Year } from "@prisma/client";
import { User, EventAssociation } from "@/context/UserContext";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, error } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasUnreadNotifications, notifications } = useNotifications();

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const logoutHandler = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      }
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
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
      label: "Notifications",
      href: "/super-admin/notifications",
      icon: (
        <FaBell className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Attendance",
      href: "/super-admin/attendance",
      icon: (
        <IconClipboardCheck className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Registrations",
      href: "/super-admin/registrations",
      icon: (
        <IconUserPlus className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Events",
      href: "/super-admin/events",
      icon: (
        <IconCalendarEvent className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Payments",
      href: "/super-admin/payments",
      icon: (
        <IconCreditCard className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Results",
      href: "/super-admin/results",
      icon: (
        <IconTrophy className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      ),
    },
    {
      label: "Logout",
      href: "/",
      icon: (
        <IconLogout className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
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
                label: user?.name || "User",
                href: "#",
                icon: (
                  <Image
                    src={
                      user?.imageUrl ||
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
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {notifications.filter((n) => !n.isRead).length}
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

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={toggleProfileModal}
        userInfo={{
          id: user ? parseInt(user.id) : 0,
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone ?? null,
          college: user?.college || "",
          sic: user?.sic || "",
          year: (user?.year || "FIRST_YEAR") as Year,
          imageUrl: user?.imageUrl ?? null,
          role: user?.role || "SUPERADMIN",
          eventParticipants: user?.eventParticipants || [],
          eventHeads: user?.eventHeads || [],
        }}
      />
    </div>
  );
}
