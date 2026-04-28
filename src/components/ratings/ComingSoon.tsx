'use client';

import Link from 'next/link';
import { Star, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';

// ------------------------------------------------------------
//  ComingSoon para Ratings
//  Ratings está deshabilitado públicamente mientras se reestructura
//  el modo. En vez de 404, mostramos esto para las personas que
//  ya tienen el link y esperan ver el rating.
// ------------------------------------------------------------

export function RatingsComingSoon() {
  const { t } = useLanguage();
  return (
    <PageLayout>
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--primary-light)]/50 flex items-center justify-center">
          <Star className="w-8 h-8 text-[var(--primary)]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
          {t('ratings.comingSoonTitle')}
        </h1>
        <p className="text-[var(--text-muted)] mb-8">
          {t('ratings.comingSoonDesc')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('votes.goHome')}
        </Link>
      </div>
    </PageLayout>
  );
}
