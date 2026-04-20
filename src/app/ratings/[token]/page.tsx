'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPollData, isExpired, hasVoted, markAsVoted, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { PageLayout } from '@/components/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import Link from 'next/link';
import { Star, Share2, ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RatingTokenPage() {
  const params = useParams();
  const { username } = useUsername();
  const token = params.token as string;
  const [pollData, setPollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  useEffect(() => {
    // Show toast if just created
    if (justCreated) {
      toast('¡Rating creado con éxito! 🎉');
      // Remove the query param from URL without triggering a reload
      window.history.replaceState({}, '', `/ratings/${token}`);
    }

    // Load poll data from localStorage
    const data = getPollData(token, 'rating');
    if (!data) {
      setError('Rating not found');
      setLoading(false);
      return;
    }

    setPollData(data);
    setExpired(isExpired(new Date(data.expiresAt)));
    setTimeRemaining(getTimeRemaining(new Date(data.expiresAt)));
    setHasVotedState(hasVoted(token, 'rating'));
    setLoading(false);

    // Update time remaining every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(new Date(data.expiresAt));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  const handleStarClick = (optionId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [optionId]: rating }));
  };

  const handleSubmitRating = () => {
    if (!pollData || Object.keys(ratings).length === 0) return;

    // Mark as voted
    markAsVoted(token, 'rating');
    setHasVotedState(true);

    // Update poll data with new ratings
    const updatedOptions = pollData.options.map((opt: any) => {
      const newRating = ratings[opt.id] || 0;
      const currentTotalRating = opt.totalRating || 0;
      const currentRatingCount = opt.ratingCount || 0;
      
      return {
        ...opt,
        totalRating: currentTotalRating + newRating,
        ratingCount: currentRatingCount + (newRating > 0 ? 1 : 0),
      };
    });

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      ratings: [...(pollData.ratings || []), { ratings, voter: username || 'Anonymous', timestamp: new Date().toISOString() }],
    };

    setPollData(updatedPollData);

    // Store updated data in localStorage
    localStorage.setItem(`pickly_rating_${token}`, JSON.stringify(updatedPollData));
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast('¡Link copiado! 🎉');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/ratings"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Rating not found</h2>
            <p className="text-[var(--text-muted)] mb-6">This rating may have been deleted or the link is invalid.</p>
            <Link href="/" className="text-[var(--primary)] hover:underline">
              Go back home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (expired) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/ratings"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
          <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">¡Se acabó el tiempo! 🎉</h2>
            <p className="text-[var(--text-muted)] mb-6">This rating has expired. Here are the final results:</p>

            {/* Results */}
            <div className="space-y-4 mb-6">
              {pollData.options
                .sort((a: any, b: any) => {
                  const avgA = a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0;
                  const avgB = b.ratingCount > 0 ? b.totalRating / b.ratingCount : 0;
                  return avgB - avgA;
                })
                .map((option: any) => {
                  const averageRating = option.ratingCount > 0 ? (option.totalRating / option.ratingCount).toFixed(1) : '0.0';

                  return (
                    <div key={option.id} className="bg-[var(--surface-2)] rounded-lg p-4">
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt={option.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <div className="mb-2">
                        <span className="font-medium text-[var(--text)]">{option.title}</span>
                        {option.comment && (
                          <p className="text-sm text-[var(--text-muted)] mt-1">{option.comment}</p>
                        )}
                        {option.locationUrl && (
                          <a
                            href={option.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            {option.locationUrl} <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= Math.round(parseFloat(averageRating))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[var(--text-muted)]">{averageRating} ({option.ratingCount} ratings)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {pollData.ratings && pollData.ratings.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-[var(--text-muted)] mb-2">Participants:</p>
                <div className="flex flex-wrap gap-1">
                  {pollData.ratings.map((r: any, idx: number) => (
                    <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                      {r.voter}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link href="/" className="text-[var(--primary)] hover:underline">
                Create your own rating
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header with Share button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/ratings"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text)]">{pollData.title}</h1>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>

        {/* Countdown */}
        <div className="bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-[var(--text-muted)] mb-1">Time remaining</p>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {formatTimeRemaining(timeRemaining)}
          </p>
        </div>

        {/* Rating Card */}
        <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8">
          {pollData.description && (
            <p className="text-[var(--text-muted)] mb-6">{pollData.description}</p>
          )}

          {hasVotedState ? (
            /* Show Results */
            <div className="space-y-4">
              <p className="text-[var(--text-muted)] mb-4">You have already rated. Here are the current results:</p>
              {pollData.options
                .sort((a: any, b: any) => {
                  const avgA = a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0;
                  const avgB = b.ratingCount > 0 ? b.totalRating / b.ratingCount : 0;
                  return avgB - avgA;
                })
                .map((option: any) => {
                  const averageRating = option.ratingCount > 0 ? (option.totalRating / option.ratingCount).toFixed(1) : '0.0';

                  return (
                    <div key={option.id} className="bg-[var(--surface-2)] rounded-lg p-4">
                      {option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt={option.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <div className="mb-2">
                        <span className="font-medium text-[var(--text)]">{option.title}</span>
                        {option.comment && (
                          <p className="text-sm text-[var(--text-muted)] mt-1">{option.comment}</p>
                        )}
                        {option.locationUrl && (
                          <a
                            href={option.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            {option.locationUrl} <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= Math.round(parseFloat(averageRating))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[var(--text-muted)]">{averageRating} ({option.ratingCount} ratings)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {pollData.ratings && pollData.ratings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] mb-2">Participants:</p>
                  <div className="flex flex-wrap gap-1">
                    {pollData.ratings.map((r: any, idx: number) => (
                      <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                        {r.voter}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show Rating Interface */
            <div className="space-y-6">
              <p className="text-[var(--text-muted)] mb-4">Rate each item from 1 to 5 stars:</p>
              {pollData.options.map((option: any) => (
                <div key={option.id} className="bg-[var(--surface-2)] rounded-lg p-4">
                  {option.imageUrl && (
                    <img
                      src={option.imageUrl}
                      alt={option.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="mb-3">
                    <span className="font-medium text-[var(--text)]">{option.title}</span>
                    {option.comment && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{option.comment}</p>
                    )}
                    {option.locationUrl && (
                      <a
                        href={option.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        {option.locationUrl} <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleStarClick(option.id, star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (ratings[option.id] || 0) >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">
                    {ratings[option.id] ? `${ratings[option.id]} star${ratings[option.id] > 1 ? 's' : ''}` : 'Not rated'}
                  </span>
                </div>
              ))}

              <button
                onClick={handleSubmitRating}
                disabled={Object.keys(ratings).length === 0}
                className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Ratings
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            Create your own rating
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
