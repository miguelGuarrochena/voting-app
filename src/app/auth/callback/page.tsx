'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';

// ------------------------------------------------------------
//  /auth/callback
//  Where Supabase redirects after:
//    - OAuth (Google): ?code=<...>&...
//    - Magic Link:     ?code=<...>&...
//    - OAuth errors:   ?error=<...>&error_description=<...>
//
//  The PKCE flow requires us to call exchangeCodeForSession(code)
//  with the code from the URL. If there's no code but the session was created anyway
//  (implicit flow, hash tokens), onAuthStateChange in AuthContext
//  already captured the session.
//
//  In any case: we redirect to `/` when we're done.
// ------------------------------------------------------------

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Errores devueltos por el provider (ej. user canceled)
      const errParam = searchParams.get('error');
      const errDesc = searchParams.get('error_description');
      if (errParam) {
        if (!cancelled) setError(errDesc || errParam);
        return;
      }

      const code = searchParams.get('code');

      if (code) {
        // PKCE: exchange code for session
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
      } else {
        // No code: could be implicit flow (tokens in hash) that the
        // Supabase client already processed, or some unusual access.
        // Check if there's already a session.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // Nothing to do here — go to home.
          if (!cancelled) router.replace('/');
          return;
        }
      }

      // If we get here, there's a session. Redirect to home.
      if (!cancelled) router.replace('/');
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <PageLayout className="pb-24 md:pb-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-10">
          <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-3">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text)] mb-2">
              {t('auth.callbackError')}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mb-5 break-words">
              {error}
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] font-medium hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 pt-10">
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {t('auth.callbackLoading')}
          </p>
        </div>
      </div>
    </PageLayout>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <PageLayout className="pb-24 md:pb-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-10">
          <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Cargando...
            </p>
          </div>
        </div>
      </PageLayout>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
