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
//  Fuente de verdad de la sesión. El resto de la app consume
//  useAuth() para saber si el user está logueado y quién es.
//
//  Notas:
//   - Login es OPCIONAL en Pickly. Si user === null, la app
//     sigue funcionando (modelo token-as-capability).
//   - El único punto donde la sesión cambia es supabase.auth.
//     Escuchamos onAuthStateChange y propagamos cambios.
//   - displayName intenta user_metadata.full_name / name
//     (Google lo manda) y si no, el prefijo del email.
// ------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Nombre "lindo" para mostrar en Navbar/avatar */
  displayName: string | null;
  /** Email primario del user (si tiene). Útil para UI. */
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

    // Sesión inicial (chequea localStorage + refresca si hace falta)
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listener de cambios: login, logout, refresh token, etc.
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
