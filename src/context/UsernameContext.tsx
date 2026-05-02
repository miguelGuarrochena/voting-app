'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Source of truth for the name your votes are signed with.
// When there's a session, the auth displayName wins (Google, etc).
// Otherwise we fall back to the anonymous name stored in localStorage.

interface UsernameContextType {
  username: string | null;
  setUsername: (name: string) => void;
  hasOnboarded: boolean;
}

const UsernameContext = createContext<UsernameContextType | undefined>(undefined);

const USERNAME_STORAGE_KEY = 'pickly_username';

export function UsernameProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const { displayName, loading: authLoading } = useAuth();

  // Initial hydration from localStorage. If the user is logged in,
  // the effect below overrides this once auth resolves.
  useEffect(() => {
    const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUsername) {
      setUsername(savedUsername);
      setHasOnboarded(true);
    }
  }, []);

  // When displayName appears (login resolves), overwrite the anonymous name.
  useEffect(() => {
    if (authLoading) return;
    if (!displayName) return;
    setUsername((prev) => (prev === displayName ? prev : displayName));
    if (localStorage.getItem(USERNAME_STORAGE_KEY) !== displayName) {
      localStorage.setItem(USERNAME_STORAGE_KEY, displayName);
    }
    setHasOnboarded(true);
  }, [displayName, authLoading]);

  const handleSetUsername = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      setUsername(trimmedName);
      localStorage.setItem(USERNAME_STORAGE_KEY, trimmedName);
      setHasOnboarded(true);
    }
  };

  return (
    <UsernameContext.Provider value={{ username, setUsername: handleSetUsername, hasOnboarded }}>
      {children}
    </UsernameContext.Provider>
  );
}

export const useUsername = () => {
  const context = useContext(UsernameContext);
  if (context === undefined) {
    throw new Error('useUsername must be used within a UsernameProvider');
  }
  return context;
};
