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

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  // Get active polls for live strip
  const activePolls = polls.filter(poll => 
    new Date(poll.expiresAt) > new Date() && poll.visibility === 'public'
  ).slice(0, 3);

  // Get filtered polls for main feed
  const filteredPolls = polls.filter(poll => poll.visibility === 'public');

  const scrollToLivePolls = () => {
    const element = document.getElementById('live-polls');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16 px-6">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-[var(--primary-light)] opacity-70 rounded-full blur-3xl transform translate-x-32 -translate-y-20" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1 
            className="font-display text-5xl md:text-7xl font-bold text-[var(--text)] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            What does <span className="text-gradient">everyone</span> think?
          </motion.h1>
          
          <motion.p 
            className="font-body text-lg md:text-xl text-[var(--text-muted)] mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Vote on anything. Share it instantly. See results in real time.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link 
              href="/create" 
              className="bg-[var(--primary)] text-white px-8 py-4 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              Create a poll →
            </Link>
            <button 
              onClick={scrollToLivePolls}
              className="border-2 border-[var(--primary)] text-[var(--primary)] px-8 py-4 rounded-full font-medium hover:bg-[var(--primary-light)] transition-colors"
            >
              Browse polls
            </button>
          </motion.div>
        </div>
      </div>

      {/* Live Polls Strip */}
      <div id="live-polls" className="px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-[var(--text)] font-display">Live now</h2>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          
          <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-snap-type-x-mandatory">
            {activePolls.map((poll, index) => (
              <motion.div
                key={poll.id}
                className="flex-none w-[280px] scroll-snap-align-start"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <PollCard poll={poll} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--text)] font-display">What's happening</h2>
            
            {/* Filter Pills */}
            <div className="flex gap-2">
              {[
                { key: 'trending', label: 'Trending', icon: '🔥' },
                { key: 'recent', label: 'Recent', icon: '' },
                { key: 'expiring', label: 'Ending Soon', icon: '' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
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

          {/* Polls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          )}

          {!isLoading && filteredPolls.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No polls found. Be the first to create one!</p>
              <Link
                href="/create"
                className="inline-block mt-4 bg-[var(--primary)] text-white px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
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
