'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowLeft, Info } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { signUpWithPassword } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Si ya hay sesión, sacamos al usuario de la página de signup
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    const ok = await signUpWithPassword(email, password);
    if (!ok) {
      setBusy(false);
      return;
    }
    // Si email confirmations ON → la sesión llega por onAuthStateChange
    // después de que el user haga click en el mail. Mientras tanto,
    // dejamos el form habilitado por si quiere reintentar.
    // Si está OFF → el useEffect de arriba redirige a /.
    setBusy(false);
  };

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <BackLink />

        {/* Banner: login es opcional */}
        <div className="flex gap-2.5 bg-[var(--primary-light)]/30 border border-[var(--primary-light)] rounded-xl p-3 mb-5 text-sm">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--primary)]" />
          <div>
            <p className="font-medium text-[var(--text)]">
              {t('auth.loginOptionalTitle')}
            </p>
            <p className="text-[var(--text-muted)] mt-0.5">
              {t('auth.loginOptionalDesc')}
            </p>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-5 sm:p-7">
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
            {t('auth.signUpTitle')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            {t('auth.signUpSubtitle')}
          </p>

          <GoogleButton
            label={t('auth.continueWithGoogle')}
            loadingLabel={t('auth.signingIn')}
          />

          <Divider label={t('auth.orDivider')} />

          <form onSubmit={onSubmit} className="space-y-3">
            <Field
              icon={<Mail className="w-4 h-4" />}
              label={t('auth.emailLabel')}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              required
            />

            <Field
              icon={<Lock className="w-4 h-4" />}
              label={t('auth.passwordLabel')}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="new-password"
              required
              minLength={6}
            />

            <p className="text-xs text-[var(--text-muted)]">
              {t('auth.passwordTooShort')}
            </p>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? t('auth.creating') : t('auth.signUpButton')}
            </button>
          </form>

          <p className="text-sm text-[var(--text-muted)] text-center mt-5">
            {t('auth.haveAccount')}{' '}
            <Link
              href="/auth/login"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              {t('auth.signInInstead')}
            </Link>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

// ------------------------------------------------------------
//  Subcomponentes locales
// ------------------------------------------------------------

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Home</span>
    </Link>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px bg-[var(--border)] flex-1" />
      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </span>
      <div className="h-px bg-[var(--border)] flex-1" />
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        {label}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full pl-10 pr-3 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        />
      </div>
    </label>
  );
}
