"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  sic: string;
  year: string;
  imageUrl: string | null;
  eventParticipation: number;
  role: string;
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

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/');
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

      // Check user role and redirect if needed
      if (userData.role === 'SUPERADMIN') {
        toast.error('Please use the Super Admin dashboard');
        router.replace('/super-admin/home');
        return;
      } else if (userData.role === 'ADMIN') {
        toast.error('Please use the Admin dashboard');
        router.replace('/admin/home');
        return;
      }

      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Set up token refresh logic
    const refreshToken = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          router.replace('/');
          toast.error('Session expired. Please log in again.');
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    };

    refreshToken();
    const refreshInterval = setInterval(refreshToken, 14 * 60 * 1000); // 14 minutes
    return () => clearInterval(refreshInterval);
  }, [router]);

  return (
    <UserContext.Provider value={{ user, isLoading, error, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}