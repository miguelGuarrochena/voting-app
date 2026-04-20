'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  useEffect(() => {
    // Check for saved username on mount
    const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUsername) {
      setUsername(savedUsername);
      setHasOnboarded(true);
    }
  }, []);

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
