"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from './UserContext';
import { toast } from 'sonner';

type NotificationType = 'TEAM_INVITE' | 'EVENT_REMINDER' | 'GENERAL';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useUser();
  const lastFetchTime = useRef<number>(0);
  const FETCH_COOLDOWN = 30000; // 30 seconds cooldown between fetches

  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < FETCH_COOLDOWN) {
      return; // Skip fetch if within cooldown period
    }

    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
      lastFetchTime.current = now;
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const refetchNotifications = useCallback(async () => {
    lastFetchTime.current = 0; // Reset cooldown to force fetch
    await fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      // Update UI optimistically
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      // Update server
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      await refetchNotifications();
    }
  }, [refetchNotifications]);

  // Fetch notifications only when user is authenticated
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up polling with a reasonable interval (e.g., every 30 seconds)
      const intervalId = setInterval(fetchNotifications, FETCH_COOLDOWN);
      
      return () => clearInterval(intervalId);
    }
  }, [user, fetchNotifications]);

  const hasUnreadNotifications = notifications.some(n => !n.isRead);

  return (
    <NotificationContext.Provider value={{
      notifications,
      hasUnreadNotifications,
      markAsRead,
      refetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}