'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Share2, ArrowLeft, GripVertical, Check } from 'lucide-react';

import { isExpired, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses } from '@/lib/db';
import { addMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

import { PageLayout } from '@/components/layout/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';

// ------------------------------------------------------------
//  RANKING — Detalle por token
//  UX: drag & drop para ordenar. Al submit, mostramos resultados en vivo.
// ------------------------------------------------------------

export default function RankingTokenPage() {
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
  const [rankings, setRankings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (justCreated) {
        toast.success(t('ranking.createdToast'));
        window.history.replaceState({}, '', `/ranking/${token}`);
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
        type: 'ranking',
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
            prev ? { ...prev, options: recomputeScores(prev.options, newResponses) } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  useEffect(() => {
    if (pollData && !hasVotedState && rankings.length === 0) {
      setRankings(pollData.options.map((opt: any) => opt.id));
    }
  }, [pollData, hasVotedState]);

  // --- drag handlers ---
  const handleDragStart = (index: number) => setDraggedItem(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    const next = [...rankings];
    const [item] = next.splice(draggedItem, 1);
    next.splice(index, 0, item);
    setRankings(next);
    setDraggedItem(index);
  };
  const handleDragEnd = () => setDraggedItem(null);

  // --- submit ---
  const handleSubmitRanking = async () => {
    if (!pollData || submitting) return;
    setSubmitting(true);
    const ok = await submitResponse(token, username || 'Anonymous', { rankings });
    setSubmitting(false);

    if (!ok) return; // db.ts ya toasteó el error real

    setHasVotedState(true);
    toast.success(t('ranking.submittedToast'));

    const newResponses = await getPollResponses(token);
    setResponses(newResponses);
    setPollData((prev: any) => ({
      ...prev,
      options: recomputeScores(prev.options, newResponses),
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

  if (loading) return <FullPageSpinner />;

  if (error === 'not_found') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <HeaderBackOnly router={router} fallback="/ranking" label={t('common.back')} />
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('ranking.notFound')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('ranking.notFoundDesc')}</p>
            <Link href="/" className="text-[var(--primary)] hover:underline font-medium">
              {t('votes.goHome')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={() => safeBack(router, '/ranking')}
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
            <span>{t('ranking.alreadyRanked')}</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6 md:p-8">
          {pollData.description && (
            <p className="text-[var(--text-muted)] mb-4 sm:mb-6">{pollData.description}</p>
          )}

          {!hasVotedState && !expired ? (
            <div className="space-y-2.5">
              <p className="text-sm text-[var(--text-muted)] font-medium mb-3">
                {t('ranking.dragToReorder')}
              </p>
              {rankings.map((optionId, index) => {
                const option = pollData.options.find((o: any) => o.id === optionId);
                if (!option) return null;

                return (
                  <div
                    key={option.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 bg-[var(--surface-2)] rounded-xl p-3 sm:p-4 cursor-move transition-all border ${
                      draggedItem === index
                        ? 'opacity-50 border-[var(--primary)]'
                        : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[var(--text)] flex-1 min-w-0 break-words">
                      {option.title}
                    </span>
                    <GripVertical className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                  </div>
                );
              })}

              <button
                onClick={handleSubmitRanking}
                disabled={submitting}
                className="w-full mt-5 bg-[var(--primary)] text-white py-3 sm:py-3.5 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-40"
              >
                {submitting ? '…' : t('ranking.submitRanking')}
              </button>
            </div>
          ) : (
            <RankingResultsList
              options={pollData.options}
              expired={expired}
              expiredTitle={t('ranking.expiredTitle')}
              expiredDesc={t('ranking.expiredDesc')}
              pointsLabel={t('ranking.points')}
            />
          )}
        </div>

        {/* Participants */}
        {responses.length > 0 && (hasVotedState || expired) && (
          <div className="mt-4 sm:mt-6 px-2">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">
              {t('ranking.participants')} ({responses.length})
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
            href="/create?type=rank"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-4 hover:underline"
          >
            {t('ranking.createYourOwn')}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

// ============================================================
//  SUBCOMPONENTES
// ============================================================

function FullPageSpinner() {
  return (
    <PageLayout>
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
      </div>
    </PageLayout>
  );
}

function HeaderBackOnly({
  router,
  fallback,
  label,
}: {
  router: ReturnType<typeof useRouter>;
  fallback: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => safeBack(router, fallback)}
        className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
        aria-label={label}
      >
        <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-muted)]">{label}</span>
      </button>
    </div>
  );
}

function RankingResultsList({
  options,
  expired,
  expiredTitle,
  expiredDesc,
  pointsLabel,
}: {
  options: any[];
  expired: boolean;
  expiredTitle: string;
  expiredDesc: string;
  pointsLabel: string;
}) {
  const sorted = [...options].sort(
    (a: any, b: any) => (b.rankingScore || 0) - (a.rankingScore || 0)
  );
  const maxScore = Math.max(1, ...sorted.map((o: any) => o.rankingScore || 0));

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
        const score = option.rankingScore || 0;
        const percentage = Math.round((score / maxScore) * 100);
        const isWinner = index === 0 && score > 0;

        return (
          <div
            key={option.id}
            className={`rounded-xl p-3 sm:p-4 border ${
              isWinner
                ? 'bg-[var(--surface-2)] border-[var(--primary-light)]'
                : 'bg-[var(--surface-2)] border-[var(--border)]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {index + 1}
                </div>
                {isWinner && <span aria-hidden>👑</span>}
                <span className="font-medium text-[var(--text)] truncate">{option.title}</span>
              </div>
              <span className="text-sm text-[var(--text-muted)] font-semibold flex-shrink-0">
                {score} {pointsLabel}
              </span>
            </div>
            <div className="w-full bg-[var(--progress-track)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- helpers ---
function recomputeScores(options: any[], responses: any[]) {
  const scores: Record<string, number> = {};
  responses.forEach((r) => {
    const ranks: string[] = r.response?.rankings || [];
    ranks.forEach((optionId: string, index: number) => {
      scores[optionId] = (scores[optionId] || 0) + (ranks.length - index);
    });
  });
  return options.map((opt: any) => ({ ...opt, rankingScore: scores[opt.id] || 0 }));
}
