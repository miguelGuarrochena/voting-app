'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import usePollStore from '@/store/pollStore';
import { motion } from 'framer-motion';
import { BarChart2, Trophy, RefreshCw, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageLayout } from '@/components/PageLayout';
import { useLanguage } from '@/context/LanguageContext';

const features = [
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
  }
];

export default function Home() {
  const { polls, loadPolls } = usePollStore();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPolls();
  }, [loadPolls]);

  // Get recent polls across all types
  const recentPolls = polls
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

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
        <div className="grid grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                style={{ height: '200px' }}
              >
                <Link
                  href={feature.href}
                  className="block h-full"
                >
                  <div className="h-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-center">
                    {/* Icon */}
                    <div className="flex justify-center mb-3">
                      <div className="w-10 h-10 flex items-center justify-center text-[var(--primary)]">
                        <Icon size={40} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-[var(--text)] mb-2 text-center">
                      {feature.id === 'votes' ? t('nav.votes') : feature.id === 'ranking' ? t('nav.ranking') : feature.id === 'ratings' ? t('nav.ratings') : t('nav.spinWheel')}
                    </h3>

                    {/* Description */}
                    <p className="text-[var(--text-muted)] text-sm text-center leading-relaxed line-clamp-2">
                      {feature.id === 'votes' ? t('home.votesDesc') : feature.id === 'ranking' ? t('home.rankingDesc') : feature.id === 'ratings' ? t('home.ratingsDesc') : t('home.spinDesc')}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12"
        >
          <h3 className="text-xl sm:text-2xl font-bold font-display text-[var(--text)] mb-6">
            {t('home.recentActivity')}
          </h3>
          {recentPolls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentPolls.map((poll, index) => {
                // Determine type badge
                const getTypeBadge = () => {
                  if (poll.type === 'rank') return { label: t('home.rankingBadge'), color: 'bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]' };
                  return { label: t('home.voteBadge'), color: 'bg-[var(--badge-info-bg)] text-[var(--badge-info-text)]' };
                };
                const typeBadge = getTypeBadge();

                return (
                  <Link
                    key={poll.id}
                    href={`/polls/${poll.id}`}
                    className="block"
                  >
                    <div className="bg-[var(--surface)] rounded-2xl shadow-sm hover:shadow-md border border-[var(--border)] p-4 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
                      {/* Type badge */}
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-semibold text-[var(--text)] mb-3 line-clamp-2 flex-1">
                        {poll.title}
                      </h4>

                      {/* Creator and time */}
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-auto">
                        <span className="truncate max-w-[120px]">{poll.createdBy}</span>
                        <span className="whitespace-nowrap">{formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[var(--text-muted)]">{t('home.noActivityYet')}</p>
            </div>
          )}
        </motion.div>
      </PageLayout>
  );
}
