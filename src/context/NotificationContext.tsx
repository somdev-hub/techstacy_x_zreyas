"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useUser } from "./UserContext";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  hasUnreadNotifications: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  clearNotifications: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useUser();
  const pathname = usePathname();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Notification fetch error:", error);
      // toast.error("Failed to fetch notifications");
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    }
  }, [fetchNotifications]);

  const clearNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/clear", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to clear notifications");
      }

      await fetchNotifications();
      toast.success("Notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  }, [fetchNotifications]);

  const refetchNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Poll for notifications every 30 seconds when user is logged in and not on login/home page
  useEffect(() => {
    const shouldPoll = user && pathname !== "/" && !pathname.includes("/login");
    
    if (shouldPoll) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, pathname, fetchNotifications]);

  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  const value = {
    notifications,
    hasUnreadNotifications,
    markAsRead,
    refetchNotifications,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
