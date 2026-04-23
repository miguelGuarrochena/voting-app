'use client';

import Link from 'next/link';
import { Swords, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';

// ------------------------------------------------------------
//  ComingSoon para Versus
//  Versus está deshabilitado públicamente mientras re-diseñamos
//  el modo "Dirección B". En vez de 404, mostramos esto para las
//  personas que ya tienen el link y esperan ver el torneo.
// ------------------------------------------------------------

export function VersusComingSoon() {
  const { t } = useLanguage();
  return (
    <PageLayout>
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--primary-light)]/50 flex items-center justify-center">
          <Swords className="w-8 h-8 text-[var(--primary)]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
          {t('versus.comingSoonTitle')}
        </h1>
        <p className="text-[var(--text-muted)] mb-8">
          {t('versus.comingSoonDesc')}
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
