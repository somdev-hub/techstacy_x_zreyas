"use client";
import React, { useState } from "react";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings
} from "@tabler/icons-react";
import Image from "next/image";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Sidebar";
import { GiPartyPopper } from "react-icons/gi";
import { BiPurchaseTagAlt } from "react-icons/bi";
import { usePathname } from "next/navigation";
import UserProfileModal from "@/components/UserProfileModal";

// Sample user data
const userInfo = {
  name: "Manu Arora",
  email: "manu@example.com",
  phone: "+91 9876543210",
  college: "Engineering Institute of Technology",
  sic: "TEC2023456",
  year: "1st",
  imageUrl: "https://assets.aceternity.com/manu.png",
  eventParticipation: 3
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard/home",
      icon: (
        <IconBrandTabler className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      )
    },
    {
      label: "Zreyas",
      href: "/dashboard/zreyas",
      icon: (
        <GiPartyPopper className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      )
    },
    {
      label: "Purchases",
      href: "/dashboard/purchases",
      icon: (
        <BiPurchaseTagAlt className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      )
    },
    {
      label: "Results",
      href: "/dashboard/results",
      icon: (
        <IconSettings className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      )
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-6 w-6 flex-shrink-0 text-neutral-200 transition-colors group-hover:text-white" />
      )
    }
  ];

  const toggleProfileModal = () => {
    setIsProfileModalOpen(!isProfileModalOpen);
  };

  return (
    <div className="bg-neutral-800 flex text-white h-[100dvh] overflow-hidden">
      <div className="">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
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
                  label: "Manu Arora",
                  href: "#",
                  icon: (
                    <Image
                      src="https://assets.aceternity.com/manu.png"
                      className="h-8 w-8 flex-shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  )
                }}
                className="hover:bg-neutral-700/50 rounded-lg text-lg font-medium cursor-pointer"
              />
            </div>
          </SidebarBody>
        </Sidebar>
      </div>
      {children}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={toggleProfileModal}
        userInfo={userInfo}
      />
    </div>
  );
}
