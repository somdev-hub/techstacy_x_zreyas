"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useUser } from "./UserContext";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

type NotificationType =
  | "TEAM_INVITE"
  | "EVENT_REMINDER"
  | "GENERAL"
  | "ANNOUNCEMENT"
  | "RESULT_DECLARATION"
  | "INVITE_ACCEPTED"
  | "INVITE_REJECTED"
  | "EVENT_CANCELLED"
  | "POSITION_UPDATE"
  | "QUALIFICATION_UPDATE";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  hasUnreadNotifications: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  refetchNotifications: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useUser();
  const pathname = usePathname();

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 30000;

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
      toast.error("Failed to fetch notifications");
    }
  }, [user]); // Added user dependency

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const scheduleReconnect = (delay: number) => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        connectSSE();
      }, delay);
    };

    try {
      const eventSource = new EventSource("/api/notifications/sse", {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            setNotifications((prev) => [data.data, ...prev]);
            toast(data.data.title, {
              description: data.data.message,
            });
          } else if (data.type === "connection") {
            reconnectAttemptsRef.current = 0;
            console.log("SSE Connected:", data.data);
          } else if (data.type === "disconnect") {
            console.log("SSE Disconnected:", data.data);
            eventSource.close();
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = async (error) => {
        console.error("SSE connection error:", error);
        eventSource.close();

        const handleReconnect = (delay: number, message: string) => {
          toast.error(message);
          scheduleReconnect(delay);
        };

        try {
          const response = await fetch("/api/notifications/sse");
          if (response.status === 429) {
            const data = await response.json();
            const retryAfter = (data.retryAfter || 60) * 1000;
            handleReconnect(
              retryAfter,
              `Rate limit exceeded. Retrying in ${Math.ceil(retryAfter / 1000)}s...`
            );
            return;
          }

          // For other error cases, use exponential backoff
          const backoffDelay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          handleReconnect(
            backoffDelay,
            `Connection lost. Retrying in ${Math.ceil(backoffDelay / 1000)}s...`
          );
        } catch (parseError) {
          console.error("Error parsing SSE error response:", parseError);
          const backoffDelay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          handleReconnect(
            backoffDelay,
            `Connection error. Retrying in ${Math.ceil(backoffDelay / 1000)}s...`
          );
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("Failed to establish SSE connection:", error);
      const backoffDelay = Math.min(
        1000 * Math.pow(2, reconnectAttemptsRef.current),
        maxReconnectDelay
      );
      toast.error(
        `Failed to connect. Retrying in ${Math.ceil(backoffDelay / 1000)}s...`
      );
      scheduleReconnect(backoffDelay);
    }
  }, []); 

  // Add a cleanup function for the notifications page
  useEffect(() => {
    return () => {
      // Reset connection attempts when component unmounts
      reconnectAttemptsRef.current = 0;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Effect for SSE connection management
  useEffect(() => {
    const shouldConnect =
      user && pathname !== "/" && !pathname.includes("/login");

    if (shouldConnect) {
      connectSSE();
      fetchNotifications();
    } else if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, pathname, connectSSE, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}/read`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }

        await fetchNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to update notification");
      }
    },
    [fetchNotifications]
  );

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
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
