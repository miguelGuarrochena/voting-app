'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, LogIn, X } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

// ------------------------------------------------------------
//  AnonCreateModal
//  Pop-up shown ONLY when the user is creating something
//  without being logged in. Gives them 2 clear options:
//    (1) Sign in → /auth/login
//    (2) Continue without account → dismiss
//
//  Dismissed by pathname + browser session (sessionStorage) so it doesn't
//  bug on every navigation. When browser session closes or they enter
//  a different flow, it reappears.
//
//  If there is a session (user !== null), it renders nothing.
// ------------------------------------------------------------

const SESSION_KEY_PREFIX = 'pickly_anon_modal_dismissed:';

export function AnonCreateModal() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setOpen(false);
      return;
    }
    // Key by path so /create, /ratings/create, and /versus/create
    // behave as "independent flows".
    try {
      const key = SESSION_KEY_PREFIX + (pathname || 'create');
      const dismissed = sessionStorage.getItem(key) === '1';
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [loading, user, pathname]);

  const dismiss = () => {
    try {
      const key = SESSION_KEY_PREFIX + (pathname || 'create');
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (loading || user || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="anon-modal-title"
    >
      <div className="relative w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header con gradiente */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[var(--primary)]/15 via-[var(--primary-light)]/20 to-transparent">
          <button
            onClick={dismiss}
            aria-label="close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h2
              id="anon-modal-title"
              className="text-lg sm:text-xl font-bold text-[var(--text)] font-display leading-tight"
            >
              {t('auth.anonModalTitle')}
            </h2>
          </div>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('auth.anonModalDesc')}
          </p>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 pt-2 space-y-2.5">
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-[var(--primary)]/30 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('auth.anonModalLogin')}</span>
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t('auth.anonModalContinue')}
          </button>
        </div>
      </div>
    </div>
  );
}
