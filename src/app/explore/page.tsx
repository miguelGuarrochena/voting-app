'use client';

import { useState, useEffect, useMemo } from 'react';
import { PollCard } from '@/components/poll/PollCard';
import usePollStore from '@/store/pollStore';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Skeleton loader component
const PollCardSkeleton = () => (
  <div className="bg-[var(--surface)] rounded-[24px] shadow-[var(--shadow-sm)] overflow-hidden border border-[var(--border)] animate-pulse">
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

type SortOption = 'recent' | 'popular' | 'trending' | 'expiring';

const ExplorePage = () => {
  const { polls, loadPolls, isLoading } = usePollStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPolls();
  }, [loadPolls]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Search is handled in the filteredPolls useMemo
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort polls
  const filteredPolls = useMemo(() => {
    let filtered = polls.filter(poll => poll.visibility === 'public');

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(query) ||
        poll.options.some(option => 
          (option.title || '').toLowerCase().includes(query)
        )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => {
          const aVotes = a.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          const bVotes = b.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          return bVotes - aVotes;
        });
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const aVotes = a.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          const bVotes = b.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          const aRecent = new Date(a.createdAt).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000);
          const bRecent = new Date(b.createdAt).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (aRecent && !bRecent) return -1;
          if (!aRecent && bRecent) return 1;
          return bVotes - aVotes;
        });
        break;
      case 'expiring':
        filtered.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
        break;
    }

    return filtered;
  }, [polls, searchQuery, sortBy]);

  const sortOptions: { value: SortOption; label: string; description: string }[] = [
    { value: 'recent', label: 'Most Recent', description: 'Newly created polls' },
    { value: 'popular', label: 'Most Popular', description: 'Highest vote count' },
    { value: 'trending', label: 'Trending', description: 'Popular recent polls' },
    { value: 'expiring', label: 'Ending Soon', description: 'Polls closing soon' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="h-8 w-32 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-6 w-64 bg-gray-200 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <PollCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] font-display mb-4">
            Explore Polls
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Discover and participate in polls from the community
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search polls by title or options..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm transition-colors"
            />
          </div>

          {/* Sort Options */}
          <div className="flex flex-wrap justify-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FunnelIcon className="h-4 w-4" />
              <span>Sort by:</span>
            </div>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  sortBy === option.value
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-[var(--text-muted)]">
            {searchQuery && (
              <>Found {filteredPolls.length} poll{filteredPolls.length !== 1 ? 's' : ''} matching "{searchQuery}"</>
            )}
            {!searchQuery && (
              <>Showing {filteredPolls.length} poll{filteredPolls.length !== 1 ? 's' : ''}</>
            )}
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <PollCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPolls.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-4xl md:text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[var(--text)] mb-2">
              {searchQuery ? 'No polls found' : 'No polls available'}
            </h3>
            <p className="text-[var(--text-muted)] mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms or browse all polls'
                : 'Be the first to create a poll and get started!'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-block bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
              >
                Clear Search
              </button>
            )}
            {!searchQuery && (
              <a
                href="/create"
                className="inline-block bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
              >
                Create a Poll
              </a>
            )}
          </motion.div>
        )}

        {/* Polls Grid */}
        {!isLoading && filteredPolls.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {filteredPolls.map((poll, index) => (
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

export default ExplorePage;
