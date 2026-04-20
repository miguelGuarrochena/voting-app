'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import usePollStore from '@/store/pollStore';
import { PollCard } from '@/components/poll/PollCard';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/PageLayout';

export default function RankingPage() {
  const { polls, loadPolls, isLoading } = usePollStore();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'recent' | 'trending'>('recent');

  useEffect(() => {
    setMounted(true);
    loadPolls();
  }, [loadPolls]);

  // Get ranking-type polls only
  const rankingPolls = polls.filter(poll =>
    poll.type === 'rank' &&
    poll.visibility === 'public' &&
    !poll.isPrivate
  );

  // Apply filter logic
  const sortedPolls = [...rankingPolls].sort((a, b) => {
    if (filter === 'trending') {
      const aVotes = a.options.reduce((sum: number, option: any) => sum + (option.votes || 0), 0);
      const bVotes = b.options.reduce((sum: number, option: any) => sum + (option.votes || 0), 0);
      return bVotes - aVotes;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (!mounted) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          <p className="text-[var(--text-muted)] mt-4">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">Rankings</h1>
            <p className="text-[var(--text-muted)] mt-1">Rank options by preference</p>
          </div>
          <Link
            href="/create?type=rank"
            className="hidden sm:flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Ranking</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              filter === 'recent'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setFilter('trending')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              filter === 'trending'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Trending
          </button>
        </div>

        {/* Polls Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            <p className="text-gray-600 mt-4">Loading rankings...</p>
          </div>
        ) : sortedPolls.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-[var(--text)] mb-2">No rankings yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Be the first to create a ranking!</p>
            <Link
              href="/create?type=rank"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Ranking
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}

      {/* Mobile FAB */}
      <Link
        href="/create?type=rank"
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>
    </PageLayout>
  );
}
