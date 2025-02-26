"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

// Default user data as fallback
const defaultUserInfo = {
  name: "User",
  email: "user@example.com",
  phone: "",
  college: "",
  sic: "",
  year: "",
  imageUrl: "https://assets.aceternity.com/avatars/default.png",
  eventParticipation: 0
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState(defaultUserInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logoutHandler = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  // Fetch user ID from cookies via API
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const idResponse = await fetch("/api/getUserId", {
          credentials: "include"
        });

        if (!idResponse.ok) {
          throw new Error("Failed to retrieve user session");
        }

        const idData = await idResponse.json();
        if (!idData.userId) {
          throw new Error("User ID not found");
        }

        setUserId(idData.userId);

        // Now fetch user details with the ID
        const userResponse = await fetch(`/api/user/${idData.userId}`, {
          credentials: "include"
        });

        if (!userResponse.ok) {
          throw new Error("Failed to retrieve user data");
        }

        const userData = await userResponse.json();
        console.log("User data:", userData);

        setUser({
          ...userData
        });
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        console.error("Error fetching user data:", error);
        setError(error.message);
        toast.error("Failed to load user data");

        // Redirect to login if authentication issue
        if (
          error.message.includes("session") ||
          error.message.includes("not found")
        ) {
          router.push("/login");
        }
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
          credentials: "include"
        });

        if (!response.ok) {
          router.push("/login");
          toast.error("Session expired. Please log in again.");
        }
      } catch (error) {
        console.error("Token refresh error:", error);
      }
    };

    // Initial token refresh
    refreshToken();

    // Set up a periodic refresh of the access token (e.g., every 14 minutes)
    const refreshInterval = setInterval(refreshToken, 14 * 60 * 1000);

    // Clean up interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [router]);

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
      ),
      onClick: logoutHandler
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
                  )
                }}
                className="hover:bg-neutral-700/50 rounded-lg text-lg font-medium cursor-pointer"
              />
            </div>
          </SidebarBody>
        </Sidebar>
      </div>
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
        children
      )}

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
          eventParticipation: user?.eventParticipation || 0
        }}
      />
    </div>
  );
}
