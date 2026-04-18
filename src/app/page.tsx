'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PollCard } from '@/components/poll/PollCard';
import { usePolls } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Poll } from '@/types/poll';
import EmptyPollsState from '@/components/EmptyPollsState';

const Home = () => {
  const router = useRouter();
  const { polls, loading, error, refreshPolls } = usePolls();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'trending' | 'recent' | 'expiring'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCards, setVisibleCards] = useState(1);

  useEffect(() => {
    // Data is automatically loaded by usePolls hook
  }, []);

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

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">{t('home.loading')}</p>
        </div>
      </div>
    );
  }

  // Get active polls for live strip
  const activePolls = (polls || []).filter(poll => 
    new Date(poll.expiresAt) > new Date() && poll.visibility === 'public'
  ).slice(0, 6);

  // Check if carousel should be enabled
  const shouldUseCarousel = activePolls.length > visibleCards;

  // Get filtered polls for main feed
  const filteredPolls = (polls || []).filter(poll => {
    const isPublic = poll.visibility === 'public';
    const matchesSearch = debouncedSearch === '' || 
      poll.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      poll.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    return isPublic && matchesSearch;
  });

  // Apply filter logic
  const sortedPolls = [...filteredPolls].sort((a, b) => {
    switch (filter) {
      case 'trending':
        // Sort by total votes and reactions
        const aEngagement = a.options.reduce((sum, opt) => sum + opt.votes + Object.values(opt.reactions).reduce((s, v) => s + v, 0), 0);
        const bEngagement = b.options.reduce((sum, opt) => sum + opt.votes + Object.values(opt.reactions).reduce((s, v) => s + v, 0), 0);
        return bEngagement - aEngagement;
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'expiring':
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      default:
        return 0;
    }
  });

  const scrollToLivePolls = () => {
    const element = document.getElementById('live-polls');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1 
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-[var(--text)] mb-4 md:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('home.hero.title')} <span className="text-gradient">{t('home.hero.titleHighlight')}</span>{t('home.hero.titleEnd')}
          </motion.h1>
          
          <motion.p 
            className="font-body text-base sm:text-lg md:text-xl text-[var(--text-muted)] mb-6 md:mb-8 max-w-2xl mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {t('home.hero.subtitle')}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isAuthenticated ? (
              <Link 
                href="/create" 
                className="bg-[var(--primary)] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm md:text-base"
              >
                {t('home.createPoll')}
              </Link>
            ) : (
              <Link 
                href="/auth/signup" 
                className="bg-[var(--primary)] text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm md:text-base"
              >
                {t('nav.getStarted')} →
              </Link>
            )}
            <button 
              onClick={scrollToLivePolls}
              className="border-2 border-[var(--primary)] text-[var(--primary)] px-6 md:px-8 py-3 md:py-4 rounded-full font-medium hover:bg-[var(--primary-light)] transition-colors text-sm md:text-base"
            >
              {t('home.browsePolls')}
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
            }}>{t('home.liveNow')}</h2>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          
          {/* Navigation Arrows - Only show when carousel is active */}
          {shouldUseCarousel && (
            <>
              {/* Left fade effect */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/80 to-transparent z-0 pointer-events-none" />
              
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
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[var(--surface)] rounded-full shadow-lg items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors flex"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-[var(--surface)] rounded-full shadow-lg items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors flex"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Right fade effect */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg)] via-[var(--bg)]/80 to-transparent z-0 pointer-events-none" />
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
                <PollCard poll={poll} />
              </motion.div>
            ))}
            {(activePolls || []).length === 0 && !loading && (
              <div className={`${shouldUseCarousel ? 'flex-none w-full' : 'col-span-full'} text-center py-8 text-[var(--text-muted)]`}>
                {t('home.noActivePolls')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-6">
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.searchPlaceholder')}
                    className="w-full px-4 py-3 pl-12 border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)]"
                  />
                  <svg className="absolute left-4 top-3.5 w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('trending')}
                    className={`px-4 py-3 rounded-[var(--radius-md)] font-medium transition-colors ${
                      filter === 'trending'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {t('home.trending')}
                  </button>
                  <button
                    onClick={() => setFilter('recent')}
                    className={`px-4 py-3 rounded-[var(--radius-md)] font-medium transition-colors ${
                      filter === 'recent'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {t('home.recent')}
                  </button>
                  <button
                    onClick={() => setFilter('expiring')}
                    className={`px-4 py-3 rounded-[var(--radius-md)] font-medium transition-colors ${
                      filter === 'expiring'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {t('home.expiringSoon')}
                  </button>
                </div>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-[var(--text)] font-display">
              {debouncedSearch ? `${t('home.searchResults')} (${filteredPolls.length})` : t('home.whatsHappening')}
            </h2>
          </div>

          {/* Polls Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {sortedPolls.map((poll: Poll, index: number) => (
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

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[var(--surface)] rounded-3xl shadow-sm overflow-hidden border border-[var(--border)] animate-pulse">
                  <div className="h-48 bg-[var(--surface-2)]" />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[var(--surface-2)]" />
                        <div className="h-4 w-24 bg-[var(--surface-2)] rounded" />
                      </div>
                      <div className="h-6 w-16 bg-[var(--surface-2)] rounded-full" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-[var(--surface-2)] rounded" />
                      <div className="h-4 bg-[var(--surface-2)] rounded w-3/4" />
                      <div className="h-2 bg-[var(--surface-2)] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-text-muted text-lg mb-2">{t('home.failedToLoad')}</p>
              <p className="text-text-muted text-sm mb-6">{error.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={refreshPolls}
                  className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors"
                >
                  {t('home.tryAgain')}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block bg-surface text-text px-6 py-3 rounded-full font-medium hover:bg-surface-2 transition-colors"
                >
                  {t('home.refreshPage')}
                </button>
              </div>
            </div>
          )}

          {!loading && !error && sortedPolls.length === 0 && (
            <EmptyPollsState onRefresh={refreshPolls} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
