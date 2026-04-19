'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/PageLayout';

// Mock rating data - will be replaced with real API
const mockRating = {
  id: '1',
  title: 'Best pizza in NYC?',
  description: 'Rate your favorite pizza places',
  createdBy: 'user1',
  createdAt: new Date(),
  isPrivate: false,
  visibility: 'public',
  items: [
    { 
      id: '1-1', 
      ratingId: '1', 
      label: 'Joe\'s Pizza', 
      imageUrl: '',
      votes: [
        { id: 'v1', itemId: '1-1', userId: 'user2', stars: 5, timestamp: new Date() },
        { id: 'v2', itemId: '1-1', userId: 'user3', stars: 4, timestamp: new Date() },
      ]
    },
    { 
      id: '1-2', 
      ratingId: '1', 
      label: 'Di Fara', 
      imageUrl: '',
      votes: [
        { id: 'v3', itemId: '1-2', userId: 'user2', stars: 4, timestamp: new Date() },
        { id: 'v4', itemId: '1-2', userId: 'user3', stars: 5, timestamp: new Date() },
      ]
    },
    { 
      id: '1-3', 
      ratingId: '1', 
      label: 'Lucali', 
      imageUrl: '',
      votes: [
        { id: 'v5', itemId: '1-3', userId: 'user2', stars: 3, timestamp: new Date() },
      ]
    },
  ]
};

export default function RatingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(mockRating);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // TODO: Load rating from API using params.id
  }, [params.id]);

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

  // Calculate average rating for an item
  const getItemAverage = (item: any) => {
    if (item.votes.length === 0) return 0;
    const sum = item.votes.reduce((acc: number, vote: any) => acc + vote.stars, 0);
    return (sum / item.votes.length).toFixed(1);
  };

  // Handle star rating
  const handleStarClick = (itemId: string, stars: number) => {
    setUserVotes(prev => ({ ...prev, [itemId]: stars }));
    // TODO: Submit vote to API
  };

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">{rating.title}</h1>
        {rating.description && (
          <p className="text-[var(--text-muted)] mb-6">{rating.description}</p>
        )}

        <div className="space-y-4">
          {rating.items.map((item) => {
            const average = getItemAverage(item);
            const userVote = userVotes[item.id];

            return (
              <div
                key={item.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.label}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-lg text-[var(--text)]">{item.label}</h3>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-bold text-xl text-[var(--text)]">{average}</span>
                    <span className="text-sm text-[var(--text-muted)]">({item.votes.length} votes)</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">Your rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(item.id, star)}
                        className="focus:outline-none"
                      >
                        {userVote !== undefined && star <= userVote ? (
                          <StarIconSolid className="w-6 h-6 text-yellow-500" />
                        ) : (
                          <StarIconOutline className="w-6 h-6 text-gray-300 hover:text-yellow-500 transition-colors" />
                        )}
                      </button>
                    ))}
                  </div>
                  {userVote && (
                    <span className="text-sm text-[var(--primary)] font-medium">
                      ({userVote} stars)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
