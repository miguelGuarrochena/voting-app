'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart2, Trophy, RefreshCw, Star, Swords } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ClaimBanner } from '@/components/auth/ClaimBanner';
import { useLanguage } from '@/context/LanguageContext';
import { FEATURES } from '@/lib/features';

const allFeatures = [
  {
    id: 'votes',
    title: 'Votes',
    description: 'Ask a question, let people choose an answer',
    icon: BarChart2,
    href: '/votes',
  },
  {
    id: 'ranking',
    title: 'Ranking',
    description: 'Let people rank options by preference',
    icon: Trophy,
    href: '/ranking',
  },
  {
    id: 'ratings',
    title: 'Ratings',
    description: 'Rate and compare items with stars',
    icon: Star,
    href: '/ratings',
  },
  {
    id: 'spin',
    title: 'Spin Wheel',
    description: 'Spin to decide randomly',
    icon: RefreshCw,
    href: '/spin',
  },
  {
    id: 'versus',
    title: 'Versus',
    description: 'Tournament-style elimination brackets',
    icon: Swords,
    href: '/versus',
  }
];

export default function Home() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Versus se muestra siempre, pero deshabilitado si la flag está off.
  const features = allFeatures;
  const isDisabled = (id: string) => id === 'versus' && !FEATURES.versus;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-24 md:pb-8">
        {/* Claim flow banner (solo si hay user logueado con polls locales) */}
        <div className="pt-4">
          <ClaimBanner />
        </div>

        {/* Hero Section */}
        <div className="text-center pb-16 sm:pb-20 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-[var(--text)] mb-6">
              ✨ Pickly
            </h1>
            <p className="text-xl sm:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const disabled = isDisabled(feature.id);

            const cardTitle =
              feature.id === 'votes' ? t('nav.votes')
                : feature.id === 'ranking' ? t('nav.ranking')
                : feature.id === 'ratings' ? t('nav.ratings')
                : feature.id === 'spin' ? t('nav.spinWheel')
                : t('nav.versus');

            const cardDesc =
              feature.id === 'votes' ? t('home.votesDesc')
                : feature.id === 'ranking' ? t('home.rankingDesc')
                : feature.id === 'ratings' ? t('home.ratingsDesc')
                : feature.id === 'spin' ? t('home.spinDesc')
                : t('home.versusDesc');

            const inner = (
              <div
                className={`relative h-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-center ${
                  disabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:scale-[1.02] hover:shadow-md cursor-pointer group'
                }`}
              >
                {Icon && (
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 flex items-center justify-center text-[var(--primary)]">
                      <Icon size={40} />
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-bold text-[var(--text)] mb-2 text-center">
                  {cardTitle}
                </h3>

                <p className="text-[var(--text-muted)] text-sm text-center leading-relaxed line-clamp-2">
                  {cardDesc}
                </p>
              </div>
            );

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="h-auto sm:h-[200px]"
              >
                {disabled ? (
                  <div
                    aria-disabled="true"
                    title={t('versus.comingSoonTitle')}
                    className="block h-full"
                  >
                    {inner}
                  </div>
                ) : (
                  <Link href={feature.href} className="block h-full">
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </PageLayout>
  );
}
