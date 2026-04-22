'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Star, Share2, ArrowLeft, ExternalLink, Check } from 'lucide-react';

import { isExpired, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses } from '@/lib/db';
import { addMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

import { PageLayout } from '@/components/layout/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';

// ------------------------------------------------------------
//  RATINGS — Detalle por token
//  Requiere puntuar TODAS las opciones antes de enviar (hint visible).
// ------------------------------------------------------------

export default function RatingTokenPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { username } = useUsername();
  const { t } = useLanguage();

  const token = params.token as string;
  const justCreated = searchParams.get('created') === 'true';

  const [pollData, setPollData] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (justCreated) {
        toast.success(t('ratings.createdToast'));
        window.history.replaceState({}, '', `/ratings/${token}`);
      }

      const data = await getPoll(token);
      if (!data) {
        setError('not_found');
        setLoading(false);
        return;
      }

      setPollData(data);
      setExpired(isExpired(new Date(data.expiresAt)));
      setTimeRemaining(getTimeRemaining(new Date(data.expiresAt)));
      setLoading(false);

      addMyPoll({
        token,
        type: 'rating',
        title: data.title,
        role: 'participant',
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      });

      const responses = await getPollResponses(token);
      setResponses(responses);
      const userResponse = responses.find((r) => r.username === username);
      setHasVotedState(!!userResponse);

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

    load();

    const channel = supabase
      .channel(`poll-responses-${token}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_responses',
          filter: `poll_token=eq.${token}`,
        },
        async () => {
          const newResponses = await getPollResponses(token);
          setResponses(newResponses);
          setPollData((prev: any) =>
            prev ? { ...prev, options: recomputeRatings(prev.options, newResponses) } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  const handleStarClick = (optionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [optionId]: rating }));
  };

  const handleSubmitRating = async () => {
    if (!pollData || submitting) return;

    const missing = pollData.options.filter(
      (opt: any) => !ratings[opt.id] || ratings[opt.id] < 1
    );
    if (missing.length > 0) {
      toast.error(t('ratings.needToRateAll').replace('{count}', String(missing.length)));
      return;
    }

    setSubmitting(true);
    const ok = await submitResponse(token, username || 'Anonymous', { ratings });
    setSubmitting(false);

    if (!ok) return; // error real ya se tosteó desde db.ts

    setHasVotedState(true);
    toast.success(t('ratings.submittedToast'));

    const newResponses = await getPollResponses(token);
    setResponses(newResponses);
    setPollData((prev: any) => ({
      ...prev,
      options: recomputeRatings(prev.options, newResponses),
    }));
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: pollData?.title, url });
        return;
      }
    } catch {
      /* cancelado */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.copied'));
    } catch {
      toast.error(t('common.copyFail'));
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      </PageLayout>
    );
  }

  if (error === 'not_found') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => safeBack(router, '/ratings')}
              className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{t('common.back')}</span>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('ratings.notFound')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('ratings.notFoundDesc')}</p>
            <Link href="/" className="text-[var(--primary)] hover:underline font-medium">
              {t('votes.goHome')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalOptions = pollData.options.length;
  const ratedOptions = pollData.options.filter(
    (o: any) => ratings[o.id] && ratings[o.id] > 0
  ).length;
  const missing = totalOptions - ratedOptions;
  const ready = missing === 0;

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => safeBack(router, '/ratings')}
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors flex-shrink-0"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)] break-words">
              {pollData.title}
            </h1>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors rounded-full sm:rounded-lg font-medium flex-shrink-0"
            aria-label={t('common.share')}
          >
            <Share2 size={18} />
            <span className="hidden sm:inline ml-2 text-sm">{t('common.share')}</span>
          </button>
        </div>

        {/* Countdown */}
        <div
          className={`rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-center border ${
            expired
              ? 'bg-[var(--badge-neutral-bg)] border-[var(--border)]'
              : 'bg-[var(--primary-light)]/40 border-[var(--primary-light)]'
          }`}
        >
          <p className="text-xs text-[var(--text-muted)] mb-1">{t('votes.timeRemaining')}</p>
          <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">
            {expired ? t('common.expired') : formatTimeRemaining(timeRemaining)}
          </p>
        </div>

        {hasVotedState && !expired && (
          <div className="flex items-center gap-2 bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] rounded-xl px-4 py-3 mb-4 sm:mb-6 text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{t('ratings.alreadyRated')}</span>
          </div>
        )}

        {/* Main card */}
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6 md:p-8">
          {pollData.description && (
            <p className="text-[var(--text-muted)] mb-4 sm:mb-6">{pollData.description}</p>
          )}

          {!hasVotedState && !expired ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-muted)] font-medium">{t('ratings.rateFromTo')}</p>

              {pollData.options.map((option: any) => (
                <RatingItem
                  key={option.id}
                  option={option}
                  value={ratings[option.id] || 0}
                  onChange={(r) => handleStarClick(option.id, r)}
                  starLabel={t('ratings.star')}
                  starsLabel={t('ratings.stars')}
                  notRatedLabel={t('ratings.notRated')}
                />
              ))}

              {/* Sticky-feeling footer: hint + botón */}
              <div className="space-y-2 pt-2">
                {!ready && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 text-center font-medium">
                    {t('ratings.needToRateAll').replace('{count}', String(missing))}
                  </p>
                )}
                <button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className={`w-full py-3 sm:py-3.5 rounded-xl font-semibold transition-colors ${
                    ready
                      ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  } disabled:opacity-40`}
                >
                  {ready
                    ? submitting
                      ? '…'
                      : t('ratings.submitRatings')
                    : `${t('ratings.submitRatings')} (${ratedOptions}/${totalOptions})`}
                </button>
              </div>
            </div>
          ) : (
            <RatingResultsList
              options={pollData.options}
              expired={expired}
              expiredTitle={t('ratings.expiredTitle')}
              expiredDesc={t('ratings.expiredDesc')}
              countLabel={t('ratings.ratingCount')}
              avgLabel={t('ratings.average')}
            />
          )}
        </div>

        {/* Participants */}
        {responses.length > 0 && (hasVotedState || expired) && (
          <div className="mt-4 sm:mt-6 px-2">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">
              {t('ratings.participants')} ({responses.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {responses.map((r: any, idx: number) => (
                <span
                  key={idx}
                  className="text-xs bg-[var(--primary-light)]/50 text-[var(--primary)] px-2.5 py-1 rounded-full font-medium"
                >
                  {r.username}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-6 sm:mt-8">
          <Link
            href="/ratings/create"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-4 hover:underline"
          >
            {t('ratings.createYourOwn')}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

// ============================================================
//  SUBCOMPONENTES
// ============================================================

function RatingItem({
  option,
  value,
  onChange,
  starLabel,
  starsLabel,
  notRatedLabel,
}: {
  option: any;
  value: number;
  onChange: (rating: number) => void;
  starLabel: string;
  starsLabel: string;
  notRatedLabel: string;
}) {
  return (
    <div className="bg-[var(--surface-2)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      {option.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.imageUrl}
          alt={option.title}
          className="w-full h-32 sm:h-40 object-cover rounded-lg mb-3"
        />
      )}
      <div className="mb-3">
        <span className="font-semibold text-[var(--text)] text-base">{option.title}</span>
        {option.comment && (
          <p className="text-sm text-[var(--text-muted)] mt-1">{option.comment}</p>
        )}
        {option.locationUrl && (
          <a
            href={option.locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1 break-all"
          >
            <span className="truncate max-w-[220px] sm:max-w-none">{option.locationUrl}</span>
            <ExternalLink size={14} className="flex-shrink-0" />
          </a>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-transform hover:scale-110 active:scale-95 p-0.5"
              aria-label={`${star} ${star === 1 ? starLabel : starsLabel}`}
            >
              <Star
                className={`w-7 h-7 sm:w-6 sm:h-6 ${
                  value >= star ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-muted)]'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs sm:text-sm text-[var(--text-muted)]">
          {value ? `${value} ${value > 1 ? starsLabel : starLabel}` : notRatedLabel}
        </span>
      </div>
    </div>
  );
}

function RatingResultsList({
  options,
  expired,
  expiredTitle,
  expiredDesc,
  countLabel,
  avgLabel,
}: {
  options: any[];
  expired: boolean;
  expiredTitle: string;
  expiredDesc: string;
  countLabel: string;
  avgLabel: string;
}) {
  const sorted = [...options].sort((a: any, b: any) => {
    const avgA = a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0;
    const avgB = b.ratingCount > 0 ? b.totalRating / b.ratingCount : 0;
    return avgB - avgA;
  });

  return (
    <div className="space-y-3">
      {expired && (
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">{expiredTitle}</h2>
          <p className="text-sm text-[var(--text-muted)]">{expiredDesc}</p>
        </div>
      )}

      {sorted.map((option: any, index: number) => {
        const avg = option.ratingCount > 0 ? option.totalRating / option.ratingCount : 0;
        const avgStr = avg.toFixed(1);
        const isWinner = index === 0 && option.ratingCount > 0;

        return (
          <div
            key={option.id}
            className={`rounded-xl p-3 sm:p-4 border ${
              isWinner
                ? 'bg-[var(--surface-2)] border-[var(--primary-light)]'
                : 'bg-[var(--surface-2)] border-[var(--border)]'
            }`}
          >
            {option.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={option.imageUrl}
                alt={option.title}
                className="w-full h-32 sm:h-36 object-cover rounded-lg mb-3"
              />
            )}
            <div className="mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {isWinner && <span aria-hidden>👑</span>}
                <span className="font-semibold text-[var(--text)] truncate">{option.title}</span>
              </div>
              {option.comment && (
                <p className="text-sm text-[var(--text-muted)] mt-1">{option.comment}</p>
              )}
              {option.locationUrl && (
                <a
                  href={option.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1 break-all"
                >
                  <span className="truncate max-w-[220px] sm:max-w-none">{option.locationUrl}</span>
                  <ExternalLink size={14} className="flex-shrink-0" />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(avg)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[var(--text-muted)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--text)] font-semibold">
                {avgStr} {avgLabel}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                · {option.ratingCount || 0} {countLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- helpers ---
function recomputeRatings(options: any[], responses: any[]) {
  const totals: Record<string, { total: number; count: number }> = {};
  responses.forEach((r) => {
    const map = r.response?.ratings || {};
    Object.entries(map).forEach(([id, val]: [string, any]) => {
      if (!totals[id]) totals[id] = { total: 0, count: 0 };
      totals[id].total += Number(val) || 0;
      totals[id].count += 1;
    });
  });
  return options.map((opt: any) => ({
    ...opt,
    totalRating: totals[opt.id]?.total || 0,
    ratingCount: totals[opt.id]?.count || 0,
  }));
}
