'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/PageLayout';

export default function RatingsPage() {
  const [mounted, setMounted] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'recent' | 'trending'>('recent');

  useEffect(() => {
    setMounted(true);
    // Load ratings from localStorage
    const allRatings: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pickly_rating_')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        allRatings.push(data);
      }
    }
    setRatings(allRatings);
  }, []);

  // Apply filter logic
  const sortedRatings = [...ratings].sort((a, b) => {
    if (filter === 'trending') {
      const aVotes = (a.options || []).reduce((sum: number, item: any) => sum + (item.ratingCount || 0), 0);
      const bVotes = (b.options || []).reduce((sum: number, item: any) => sum + (item.ratingCount || 0), 0);
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
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  // Calculate average rating for a rating
  const getAverageRating = (rating: any) => {
    const options = rating.options || [];
    if (options.length === 0) return 0;
    const totalRating = options.reduce((sum: number, item: any) => sum + (item.totalRating || 0), 0);
    const totalVotes = options.reduce((sum: number, item: any) => sum + (item.ratingCount || 0), 0);
    if (totalVotes === 0) return 0;
    return (totalRating / totalVotes).toFixed(1);
  };

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">Ratings</h1>
            <p className="text-[var(--text-muted)] mt-1">Rate and review items</p>
          </div>
          <Link
            href="/ratings/create"
            className="hidden sm:flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Rating</span>
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

        {/* Ratings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            <p className="text-gray-600 mt-4">Loading ratings...</p>
          </div>
        ) : sortedRatings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-[var(--text)] mb-2">No ratings yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Be the first to create a rating!</p>
            <Link
              href="/ratings/create"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Rating
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRatings.map((rating) => (
              <Link
                key={rating.token}
                href={`/ratings/${rating.token}`}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-bold text-lg text-[var(--text)] mb-2">{rating.title}</h3>
                {rating.description && (
                  <p className="text-sm text-[var(--text-muted)] mb-3">{rating.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">{(rating.options || []).length} items</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold text-[var(--text)]">{getAverageRating(rating)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <Link
        href="/ratings/create"
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--primary-dark)] transition-colors z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>
    </PageLayout>
  );
}
