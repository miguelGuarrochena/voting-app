'use client';

import { ReactNode, useEffect } from 'react';
import { usePollStore } from '@/store/usePollStore';

// This component ensures the store is properly initialized on the client
export default function StoreProvider({ children }: { children: ReactNode }) {
  // Initialize the store on the client side
  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  return <>{children}</>;
}
