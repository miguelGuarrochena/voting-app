'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import usePollStore from '@/store/pollStore';
import { PollCard } from '@/components/poll/PollCard';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/PageLayout';
import { useLanguage } from '@/context/LanguageContext';

export default function VotesPage() {
  const { polls, loadPolls, isLoading } = usePollStore();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPolls();
  }, [loadPolls]);

  // Get vote-type polls only
  const votePolls = polls.filter(poll =>
    poll.type === 'vote'
  );

  if (!mounted) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          <p className="text-[var(--text-muted)] mt-4">{t('common.loading')}...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">{t('votes.title')}</h1>
            <p className="text-[var(--text-muted)] mt-1">{t('votes.subtitle')}</p>
          </div>
          <Link
            href="/create?type=vote"
            className="hidden sm:flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{t('votes.createVote')}</span>
          </Link>
        </div>


        {/* Empty State */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🗳️</div>
          <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Compartí un link para que tus amigos puedan votar ✨</h3>
        </div>
      {/* Mobile FAB */}
      <Link
        href="/create?type=vote"
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>
    </PageLayout>
  );
}
