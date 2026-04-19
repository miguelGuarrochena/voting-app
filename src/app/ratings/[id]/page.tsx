'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/PageLayout';
import { ImageModal } from '@/components/ImageModal';

export default function RatingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rating, setRating] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load rating from localStorage using params.id
    const storedRatings = JSON.parse(localStorage.getItem('ratings') || '[]');
    const foundRating = storedRatings.find((r: any) => r.id === params.id);
    if (foundRating) {
      setRating(foundRating);
    }
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

  if (!rating) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <p className="text-gray-600">Rating not found</p>
          <button
            onClick={() => router.push('/ratings')}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg"
          >
            Back to Ratings
          </button>
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
          {rating.items.map((item: any) => {
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
                        className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setModalImage({ url: item.imageUrl, alt: item.label })}
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

        {modalImage && (
          <ImageModal
            imageUrl={modalImage.url}
            alt={modalImage.alt}
            onClose={() => setModalImage(null)}
          />
        )}
      </div>
    </PageLayout>
  );
}
