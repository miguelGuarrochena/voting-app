'use client';

import { useState, useEffect } from 'react';
import { PollCard } from '@/components/poll/PollCard';
import usePollStore from '@/store/pollStore';
import { motion } from 'framer-motion';

// Skeleton loader component
const PollCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-[24px] shadow-[var(--shadow-sm)] overflow-hidden border border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="h-[200px] bg-gray-200" />
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

const TrendingPage = () => {
  const { polls, loadPolls, isLoading } = usePollStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPolls();
  }, [loadPolls]);

  // Get trending polls (most voted in the last 24 hours)
  const trendingPolls = polls
    .filter(poll => poll.visibility === 'public' && !poll.isPrivate)
    .sort((a, b) => {
      const aVotes = a.options.reduce((sum, option) => sum + (option.votes || 0), 0);
      const bVotes = b.options.reduce((sum, option) => sum + (option.votes || 0), 0);
      return bVotes - aVotes;
    })
    .slice(0, 12);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] pt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="h-8 w-32 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-6 w-64 bg-gray-200 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <PollCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] font-display">
              Trending Polls
            </h1>
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          </div>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Discover the most popular polls and see what everyone is voting on right now.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-800">
            <div className="text-2xl font-bold text-[var(--primary)]">{trendingPolls.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Polls</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-800">
            <div className="text-2xl font-bold text-[var(--primary)]">
              {trendingPolls.reduce((sum, poll) => 
                sum + poll.options.reduce((optSum, option) => optSum + (option.votes || 0), 0), 0
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Votes</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-800">
            <div className="text-2xl font-bold text-[var(--primary)]">
              {trendingPolls.filter(poll => new Date(poll.expiresAt) > new Date()).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Still Active</div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <PollCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && trendingPolls.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold text-[var(--text)] mb-2">No trending polls yet</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Be the first to create a poll and start trending!
            </p>
            <a
              href="/create"
              className="inline-block bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              Create a Poll
            </a>
          </motion.div>
        )}

        {/* Trending Polls Grid */}
        {!isLoading && trendingPolls.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {trendingPolls.map((poll, index) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <PollCard poll={poll} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrendingPage;
