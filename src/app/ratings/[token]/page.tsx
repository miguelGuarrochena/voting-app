'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { isExpired, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses } from '@/lib/db';
import { addMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Share2, ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function RatingTokenPage() {
  const router = useRouter();
  const params = useParams();
  const { username } = useUsername();
  const { t } = useLanguage();
  const token = params.token as string;
  const [pollData, setPollData] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  useEffect(() => {
    const loadRating = async () => {
      // Show toast if just created
      if (justCreated) {
        toast('¡Rating creado con éxito! 🎉');
        // Remove the query param from URL without triggering a reload
        window.history.replaceState({}, '', `/ratings/${token}`);
      }

      // Load poll data from Supabase
      const data = await getPoll(token);
      if (!data) {
        setError('Rating not found');
        setLoading(false);
        return;
      }

      setPollData(data);
      setExpired(isExpired(new Date(data.expiresAt)));
      setTimeRemaining(getTimeRemaining(new Date(data.expiresAt)));
      setLoading(false);

      // Guardar en "mis ratings" como participante.
      addMyPoll({
        token,
        type: 'rating',
        title: data.title,
        role: 'participant',
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      });

      // Load responses to check if user has voted
      const responses = await getPollResponses(token);
      setResponses(responses);
      const userResponse = responses.find(r => r.username === username);
      setHasVotedState(!!userResponse);

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
    };

    loadRating();

    // Set up Realtime subscription
    const channel = supabase
      .channel('poll-responses')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'poll_responses',
        filter: `poll_token=eq.${token}`
      }, async (payload) => {
        // Reload responses when new response comes in
        const responses = await getPollResponses(token);
        setResponses(responses);
        const userResponse = responses.find(r => r.username === username);
        setHasVotedState(!!userResponse);

        // Recalculate rating totals
        const ratingTotals: Record<string, { total: number; count: number }> = {};
        responses.forEach(response => {
          const responseRatings = response.response.ratings || {};
          Object.entries(responseRatings).forEach(([optionId, rating]: [string, any]) => {
            if (!ratingTotals[optionId]) {
              ratingTotals[optionId] = { total: 0, count: 0 };
            }
            ratingTotals[optionId].total += rating;
            ratingTotals[optionId].count += 1;
          });
        });

        // Update poll options with new rating totals
        setPollData((prev: any) => ({
          ...prev,
          options: prev.options.map((opt: any) => ({
            ...opt,
            totalRating: ratingTotals[opt.id]?.total || 0,
            ratingCount: ratingTotals[opt.id]?.count || 0
          })),
          ratings: responses.map(r => ({ ratings: r.response.ratings, voter: r.username, timestamp: r.created_at }))
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  const handleStarClick = (optionId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [optionId]: rating }));
  };

  const handleSubmitRating = async () => {
    if (!pollData) return;

    // Requerimos que el usuario haya puntuado TODAS las opciones.
    const missing = pollData.options.filter(
      (opt: any) => !ratings[opt.id] || ratings[opt.id] < 1
    );
    if (missing.length > 0) {
      toast.error(
        t('ratings.needToRateAll')
          .replace('{count}', String(missing.length))
      );
      return;
    }

    // Submit response to Supabase
    const success = await submitResponse(token, username || 'Anonymous', { ratings });
    
    if (!success) {
      toast.error('Error al enviar tus valoraciones');
      return;
    }

    setHasVotedState(true);
    toast('¡Valoraciones enviadas! 🎉');

    // Reload responses to get updated rating totals
    const newResponses = await getPollResponses(token);
    setResponses(newResponses);

    // Calculate rating totals from responses
    const ratingTotals: Record<string, { total: number; count: number }> = {};
    newResponses.forEach(response => {
      const responseRatings = response.response.ratings || {};
      Object.entries(responseRatings).forEach(([optionId, rating]: [string, any]) => {
        if (!ratingTotals[optionId]) {
          ratingTotals[optionId] = { total: 0, count: 0 };
        }
        ratingTotals[optionId].total += rating;
        ratingTotals[optionId].count += 1;
      });
    });

    // Update poll data with new rating totals
    const updatedOptions = pollData.options.map((opt: any) => ({
      ...opt,
      totalRating: ratingTotals[opt.id]?.total || 0,
      ratingCount: ratingTotals[opt.id]?.count || 0,
    }));

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      ratings: newResponses.map(r => ({ ratings: r.response.ratings, voter: r.username, timestamp: r.created_at })),
    };

    setPollData(updatedPollData);
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
            <button
              onClick={() => safeBack(router, '/ratings')}
              className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{t('common.back')}</span>
            </button>
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
            <button
              onClick={() => safeBack(router, '/ratings')}
              className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{t('common.back')}</span>
            </button>
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
            {responses.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-[var(--text-muted)] mb-2">Participants:</p>
                <div className="flex flex-wrap gap-1">
                  {responses.map((r: any, idx: number) => (
                    <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                      {r.username}
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
            <button
              onClick={() => safeBack(router, '/ratings')}
              className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{t('common.back')}</span>
            </button>
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
              {responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] mb-2">Participants:</p>
                  <div className="flex flex-wrap gap-1">
                    {responses.map((r: any, idx: number) => (
                      <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                        {r.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show Rating Interface */
            <div className="space-y-6">
              <p className="text-[var(--text-muted)] mb-4">{t('ratings.rateFromTo')}</p>
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

              {(() => {
                const totalOptions = pollData.options.length;
                const ratedOptions = pollData.options.filter(
                  (o: any) => ratings[o.id] && ratings[o.id] > 0
                ).length;
                const missing = totalOptions - ratedOptions;
                const ready = missing === 0;

                return (
                  <div className="space-y-2">
                    {!ready && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                        {t('ratings.needToRateAll').replace(
                          '{count}',
                          String(missing)
                        )}
                      </p>
                    )}
                    <button
                      onClick={handleSubmitRating}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        ready
                          ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                          : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      {ready
                        ? t('ratings.submitRatings')
                        : `${t('ratings.submitRatings')} (${ratedOptions}/${totalOptions})`}
                    </button>
                  </div>
                );
              })()}
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
