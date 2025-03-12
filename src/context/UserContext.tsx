"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Events } from "@prisma/client";

export type Year = "FIRST_YEAR" | "SECOND_YEAR" | "THIRD_YEAR" | "FOURTH_YEAR";

export interface EventWithDetails {
  eventName: Events;
  name: string;
  imageUrl: string;
}

export interface EventAssociation {
  event: EventWithDetails;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string;
  sic: string;
  year: Year;
  imageUrl: string | null;
  eventParticipants: EventAssociation[];
  eventHeads: EventAssociation[];
  role: "SUPERADMIN" | "ADMIN" | "USER";
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  };

  const fetchUser = async () => {
    // Skip API calls on home page
    if (pathname === "/") {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/me", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh the token
          try {
            const userData = await refreshToken();
            setUser(userData);
            setError(null);
            return;
          } catch (refreshError) {
            if (pathname !== "/") {
              router.replace("/");
              toast.error("Session expired. Please log in again.");
            }
            return;
          }
        }
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
      setError(err instanceof Error ? err.message : "Failed to load user data");
      if (pathname !== "/") {
        router.replace("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip everything if on home page
    if (pathname === "/") {
      setUser(null);
      setIsLoading(false);
      return;
    }

    fetchUser();

    // Set up automatic token refresh - try to refresh 1 minute before expiry
    const refreshInterval = setInterval(() => {
      refreshToken()
        .then((userData) => {
          setUser(userData);
        })
        .catch((error) => {
          console.error("Auto refresh failed:", error);
          // Only redirect if not already on home page
          if (pathname !== "/") {
            router.replace("/");
            toast.error("Session expired. Please log in again.");
          }
        });
    }, 14 * 60 * 1000); // 14 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [pathname]);

  return (
    <UserContext.Provider
      value={{ user, isLoading, error, refreshUser: fetchUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
