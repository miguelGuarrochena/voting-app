'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ------------------------------------------------------------
//  AuthContext
//  Source of truth for the session. The rest of the app consumes
//  useAuth() to know if the user is logged in and who they are.
//
//  Notes:
//   - Login is OPTIONAL in Pickly. If user === null, the app
//     keeps working (token-as-capability model).
//   - The only place where the session changes is supabase.auth.
//     We listen to onAuthStateChange and propagate changes.
//   - displayName tries user_metadata.full_name / name
//     (Google sends it) and if not, the email prefix.
// ------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** "Nice" name to display in Navbar/avatar */
  displayName: string | null;
  /** User's primary email (if any). Useful for UI. */
  email: string | null;
  /** Avatar URL (Google / gravatar / null) */
  avatarUrl: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial session (checks localStorage + refreshes if needed)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listener for changes: login, logout, refresh token, etc.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const displayName = user ? pickDisplayName(user) : null;
  const email = user?.email ?? null;
  const avatarUrl = (user?.user_metadata?.avatar_url as string) ?? null;

  return (
    <AuthContext.Provider
      value={{ user, session, loading, displayName, email, avatarUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

// ------------------------------------------------------------
//  Helpers
// ------------------------------------------------------------

function pickDisplayName(user: User): string {
  const meta = user.user_metadata || {};
  const candidates = [
    meta.full_name,
    meta.name,
    meta.preferred_username,
    meta.user_name,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  if (user.email) return user.email.split('@')[0];
  return 'User';
}
