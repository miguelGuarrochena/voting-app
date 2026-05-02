'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

// ------------------------------------------------------------
//  /auth/login
//
//  Pickly v1: the ONLY login method is Google OAuth.
//
//  Product decision: we started without email+password and magic link
//  to avoid paying for our own SMTP at launch. Anyone without a Google account
//  can still create/vote on polls anonymously without logging in.
//
//  If we want to add email+password again in the future, the base functions
//  already exist in lib/auth.ts (signInWithMagicLink, signInWithPassword,
//  etc) — they're commented out or deleted in this version, see git history.
// ------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading } = useAuth();

  // If there's already a session, redirect the user away from the login page.
  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {/* Banner: login is optional */}
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
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            {t('auth.loginSubtitle')}
          </p>

          <GoogleButton
            label={t('auth.continueWithGoogle')}
            loadingLabel={t('auth.signingIn')}
          />
        </div>
      </div>
    </PageLayout>
  );
}
