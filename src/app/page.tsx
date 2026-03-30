'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PollCard } from '@/components/PollCard';
import usePollStore from '@/store/pollStore';

export default function Home() {
  const router = useRouter();
  const { polls, loadPolls, isLoading } = usePollStore();
  const [filter, setFilter] = useState<'trending' | 'recent' | 'expiring'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCards, setVisibleCards] = useState(1);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Responsive card count
  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;
      if (width < 768) setVisibleCards(1); // Mobile
      else if (width < 1024) setVisibleCards(2); // Tablet
      else setVisibleCards(3); // Desktop
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  // Get active polls for live strip
  const activePolls = polls.filter(poll => 
    new Date(poll.expiresAt) > new Date() && poll.visibility === 'public'
  ).slice(0, 6); // Allow more for carousel

  // Check if carousel should be enabled
  const shouldUseCarousel = activePolls.length > visibleCards;

  // Get filtered polls for main feed
  const filteredPolls = polls.filter(poll => {
    const isPublic = poll.visibility === 'public';
    const matchesSearch = debouncedSearch === '' || 
      poll.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      poll.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    return isPublic && matchesSearch;
  });

  const scrollToLivePolls = () => {
    const element = document.getElementById('live-polls');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[400px] bg-[var(--primary-light)] opacity-70 rounded-full blur-3xl transform translate-x-16 md:translate-x-32 -translate-y-20" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1 
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-[var(--text)] mb-4 md:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            What does <span className="text-gradient">everyone</span> think?
          </motion.h1>
          
          <motion.p 
            className="font-body text-base sm:text-lg md:text-xl text-[var(--text-muted)] mb-6 md:mb-8 max-w-2xl mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Vote on anything. Share it instantly. See results in real time.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link 
              href="/create" 
              className="bg-[var(--primary)] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm md:text-base"
            >
              Create a poll →
            </Link>
            <button 
              onClick={scrollToLivePolls}
              className="border-2 border-[var(--primary)] text-[var(--primary)] px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-[var(--primary-light)] transition-colors text-sm md:text-base"
            >
              Browse polls
            </button>
          </motion.div>
        </div>
      </div>

      {/* Live Polls Strip */}
      <div id="live-polls" className="px-4 sm:px-6 lg:px-8 pb-6 md:pb-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-4 md:mb-6 relative z-10">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text)] font-display antialiased" style={{ 
              WebkitFontSmoothing: 'antialiased', 
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              filter: 'none',
              backdropFilter: 'none',
              opacity: 1
            }}>Live now</h2>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          
          {/* Navigation Arrows - Only show when carousel is active */}
          {shouldUseCarousel && (
            <>
              {/* Left fade effect */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-0 pointer-events-none" />
              
              <button
                onClick={() => {
                  const container = document.getElementById('live-polls-container');
                  if (container) {
                    const cardWidth = visibleCards === 1 ? 
                      window.innerWidth - 32 : 
                      320;
                    container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors flex"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  const container = document.getElementById('live-polls-container');
                  if (container) {
                    const cardWidth = visibleCards === 1 ? 
                      window.innerWidth - 32 : 
                      320;
                    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors flex"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Right fade effect */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-0 pointer-events-none" />
            </>
          )}

          {/* Container - Responsive layout */}
          <div 
            id="live-polls-container"
            className={`${
              shouldUseCarousel 
                ? 'flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory px-4' 
                : `grid gap-4 md:gap-6 ${
                    visibleCards === 1 ? 'grid-cols-1' : 
                    visibleCards === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activePolls.slice(0, shouldUseCarousel ? undefined : visibleCards).map((poll, index) => (
              <motion.div
                key={poll.id}
                className={`${
                  shouldUseCarousel 
                    ? `flex-none snap-start ${
                        visibleCards === 1 ? 'w-[calc(100vw-2rem)]' : 
                        visibleCards === 2 ? 'w-[320px]' : 
                        'w-[320px] lg:w-[384px]'
                      }`
                    : 'w-full'
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <PollCard poll={poll} compact={true} />
              </motion.div>
            ))}
            {activePolls.length === 0 && !isLoading && (
              <div className={`${shouldUseCarousel ? 'flex-none w-full' : 'col-span-full'} text-center py-8 text-[var(--text-muted)]`}>
                No active polls at the moment.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search polls by title or description..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--text)] font-display">
                {debouncedSearch ? `Search Results (${filteredPolls.length})` : 'What\'s happening'}
              </h2>
              
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'trending', label: 'Trending', icon: '🔥' },
                  { key: 'recent', label: 'Recent', icon: '' },
                  { key: 'expiring', label: 'Ending Soon', icon: '' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as any)}
                    className={`px-3 md:px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base ${
                      filter === filterOption.key
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {filterOption.icon && <span className="mr-1">{filterOption.icon}</span>}
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Polls Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
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
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-[24px] shadow-[var(--shadow-sm)] overflow-hidden border border-[var(--border)] animate-pulse">
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredPolls.length === 0 && (
            <div className="text-center py-12 md:py-16">
              <div className="text-4xl md:text-5xl mb-4">📊</div>
              <p className="text-[var(--text-muted)] text-base md:text-lg mb-6">No polls found. Be the first to create one!</p>
              <Link
                href="/create"
                className="inline-block bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
              >
                Create a Poll
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
