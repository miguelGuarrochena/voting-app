'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';

// Lista de rutas donde el username SÍ es requerido inmediato. En home,
// listados, /auth/*, /privacy/, /terms y /spin no tiene sentido bloquear
// al user con un onboarding modal — primero que browseé.
function pathRequiresUsername(pathname: string): boolean {
  if (
    pathname === '/create' ||
    pathname === '/ratings/create' ||
    pathname === '/versus/create'
  ) {
    return true;
  }
  // /votes/[token], /ranking/[token], /ratings/[token], /versus/[token]
  return /^\/(votes|ranking|ratings|versus)\/[^/]+/.test(pathname);
}

export default function OnboardingScreen() {
  const { username, setUsername, hasOnboarded } = useUsername();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show if user already has a username, not mounted yet,
  // o si la ruta no necesita username inmediato (home, listados, etc).
  if (!mounted || username || !pathRequiresUsername(pathname || '')) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t('onboarding.errorMin'));
      return;
    }

    if (trimmedName.length > 20) {
      setError(t('onboarding.errorMax'));
      return;
    }

    setUsername(trimmedName);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold font-display text-[var(--primary)] mb-2">
              ✨ Pickly
            </h1>
            <p className="text-[var(--text-muted)]">{t('onboarding.tagline')}</p>
          </div>

          {/* Question */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-6">
            {t('onboarding.question')} ✨
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder={t('onboarding.placeholder')}
                maxLength={20}
                className="w-full px-6 py-4 text-lg border-2 border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all text-center"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {t('onboarding.button')}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            {t('onboarding.note')} 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
