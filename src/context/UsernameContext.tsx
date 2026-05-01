'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// ------------------------------------------------------------
//  UsernameContext
//
//  Fuente de verdad del "nombre con el que firmo mis votos".
//  Reglas:
//    1) Si NO hay sesión, se usa el nombre anónimo que el usuario
//       tipea en OnboardingScreen y queda persistido en
//       localStorage.pickly_username.
//    2) Si HAY sesión (Google OAuth, magic link, etc.), la
//       identidad autenticada manda: pisamos el nombre anónimo
//       con `displayName` (user_metadata.full_name / name) y lo
//       persistimos. Esto evita que alguien siga firmando como
//       "Miguel" después de loguearse como "Miguel Guarrochena".
//    3) Logout limpia localStorage.pickly_username (en Navbar),
//       así el próximo usuario del mismo navegador parte de cero.
//
//  Para overrides puntuales (firmar una poll con un alias),
//  llamar a `setUsername(...)` desde el formulario — el override
//  también se persiste, pero el próximo login lo vuelve a pisar.
// ------------------------------------------------------------

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

  // (1) Hidratación inicial desde localStorage. Si el user está
  // logueado, el effect (2) lo va a sobreescribir apenas auth
  // resuelva — es el comportamiento esperado.
  useEffect(() => {
    const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    if (savedUsername) {
      setUsername(savedUsername);
      setHasOnboarded(true);
    }
  }, []);

  // (2) Sync con auth. Cuando el user se loguea, su displayName
  // pasa a ser la fuente de verdad y pisa el nombre anónimo.
  // Si auth todavía está cargando o el user es anónimo, no
  // tocamos nada (preservamos lo del localStorage).
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
