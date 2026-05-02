'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { MyPollCard } from '@/components/mypolls/MyPollCard';
import { ListingEmptyState } from '@/components/mypolls/ListingEmptyState';
import {
  findMyPoll,
  removeMyPoll,
  pruneExpiredMyPolls,
  type MyPollEntry,
} from '@/lib/mypolls';
import { getMyPollsHybrid } from '@/lib/mypollsHybrid';
import { deletePoll } from '@/lib/db';

export default function RankingPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<MyPollEntry[]>([]);

  const refresh = useCallback(async () => {
    pruneExpiredMyPolls();
    const list = await getMyPollsHybrid('ranking', !!user);
    setEntries(list);
  }, [user]);

  useEffect(() => {
    setMounted(true);
    if (!authLoading) refresh();
  }, [refresh, authLoading]);

  const handleRemove = async (token: string) => {
    // Same as /votes: creator entries must be deleted on the server,
    // otherwise refresh() pulls them back from get_my_polls_rpc.
    const entry = entries.find((e) => e.token === token) ?? findMyPoll(token);
    if (entry?.role === 'creator') {
      const ok = await deletePoll(token);
      if (!ok) return; // deletePoll already showed an error toast
    }
    removeMyPoll(token);
    toast.success(t('common.removed'));
    refresh();
  };

  if (!mounted) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          <p className="text-[var(--text-muted)] mt-4">{t('common.loading')}</p>
        </div>
      </PageLayout>
    );
  }

  const isEmpty = entries.length === 0;

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] truncate">
              {t('ranking.title')}
            </h1>
            <p className="text-[var(--text-muted)] text-sm sm:text-base mt-1">
              {t('ranking.subtitle')}
            </p>
          </div>
          {!isEmpty && (
            <Link
              href="/create?type=rank"
              className="hidden sm:inline-flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors whitespace-nowrap"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('ranking.createRanking')}</span>
            </Link>
          )}
        </div>

        {isEmpty ? (
          <ListingEmptyState
            emoji="🏆"
            title={t('ranking.emptyState')}
            ctaHref="/create?type=rank"
            ctaLabel={t('ranking.createRanking')}
          />
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <MyPollCard
                key={entry.token}
                entry={entry}
                href={`/ranking/${entry.token}`}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {!isEmpty && (
        <Link
          href="/create?type=rank"
          className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors z-40"
          aria-label={t('ranking.createRanking')}
        >
          <PlusIcon className="w-6 h-6" />
        </Link>
      )}
    </PageLayout>
  );
}
