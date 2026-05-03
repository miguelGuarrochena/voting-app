'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Share2, ArrowLeft, GripVertical, Check, Eye, ChevronUp, ChevronDown, Lock } from 'lucide-react';

import { isTerminal, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses, deletePoll, closePoll, updatePollTitle } from '@/lib/db';
import { addMyPoll, findMyPoll, removeMyPoll } from '@/lib/mypolls';
import { supabase } from '@/lib/supabase';

import { PageLayout } from '@/components/layout/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import { OwnerMenu, OwnerMenuItem } from '@/components/common/OwnerMenu';
import ConfirmModal from '@/components/modals/ConfirmModal';
import EditTitleModal from '@/components/modals/EditTitleModal';
import { ImageModal } from '@/components/modals/ImageModal';
import { AnimatePresence } from 'framer-motion';
import { WinnerPodium, PodiumEntry } from '@/components/results/WinnerPodium';
import { fireWinnerConfetti } from '@/lib/confetti';

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
  const getCaptchaToken = useTurnstile('ranking_submit');

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
  const [isCreator, setIsCreator] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ url: string; alt: string } | null>(null);
  const [wasJustCreated, setWasJustCreated] = useState(justCreated);

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
      setExpired(isTerminal(new Date(data.expiresAt), data.closedAt));
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

      const my = findMyPoll(token);
      setIsCreator(my?.role === 'creator');

      const responses = await getPollResponses(token);
      setResponses(responses);
      // Recompute scores from the responses we already loaded.
      // Without this, options would render with 0 points on open until
      // the first realtime event came in.
      setPollData((prev: any) =>
        prev ? { ...prev, options: recomputeScores(prev.options, responses) } : prev
      );
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

  // Confeti al pasar a expirado
  useEffect(() => {
    if (expired && pollData) {
      const hasScores = (pollData.options ?? []).some(
        (o: any) => (o.rankingScore || 0) > 0
      );
      if (hasScores) fireWinnerConfetti(token);
    }
  }, [expired, pollData, token]);

  useEffect(() => {
    if (pollData && !hasVotedState && rankings.length === 0) {
      setRankings(pollData.options.map((opt: any) => opt.id));
    }
  }, [pollData, hasVotedState]);

  // --- drag handlers (desktop) ---
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

  // --- move up/down (mobile + fallback accesible) ---
  const handleMove = (from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= rankings.length) return;
    const next = [...rankings];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setRankings(next);
  };

  // --- submit ---
  const handleSubmitRanking = async () => {
    if (!pollData || submitting) return;
    setSubmitting(true);
    const captchaToken = await getCaptchaToken();
    const ok = await submitResponse(token, username || 'Anonymous', { rankings }, captchaToken);
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

  const handleDelete = async () => {
    // db.ts handles the ownership-mismatch case from the RPC's
    // 'forbidden' exception with an actionable toast. No pre-empt
    // here — AuthContext can still be hydrating when the user clicks.
    const ok = await deletePoll(token);
    if (!ok) return;
    removeMyPoll(token);
    toast.success(t('common.removed'));
    router.push('/ranking');
  };

  const handleCloseNow = async () => {
    const ok = await closePoll(token);
    if (!ok) return;
    toast.success(t('poll.closedToast'));
    setExpired(true);
    setTimeRemaining(0);
    setPollData((prev: any) =>
      prev ? { ...prev, closedAt: new Date().toISOString() } : prev
    );
  };

  const handleEditTitle = async (newTitle: string): Promise<boolean> => {
    const ok = await updatePollTitle(token, newTitle);
    if (!ok) return false;
    toast.success(t('poll.titleUpdated'));
    setPollData((prev: any) => prev ? { ...prev, title: newTitle } : prev);
    return true;
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
        {/* Breadcrumb */}
        <button
          onClick={() => {
            if (isCreator && !hasVotedState && wasJustCreated) {
              router.push(`/ranking/${token}/edit`);
            } else {
              // Always go to the listing, not browser back. Otherwise a freshly
              // created ranking lands on /create when the user hits this button.
              router.push('/ranking');
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isCreator && !hasVotedState && wasJustCreated ? t('poll.edit') : t('ranking.title')}</span>
        </button>

        {/* Header: título + acciones */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)] break-words min-w-0 flex-1">
            {pollData.title}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors rounded-full sm:rounded-lg font-medium"
              aria-label={t('common.share')}
            >
              <Share2 size={18} />
              <span className="hidden sm:inline ml-2 text-sm">{t('common.share')}</span>
            </button>
            {isCreator && (
              <OwnerMenu
                ariaLabel={t('common.actions') || 'Acciones'}
                items={buildOwnerItems({
                  expired,
                  t,
                  onEdit: () => setShowEditModal(true),
                  onClose: () => setShowCloseModal(true),
                  onDelete: () => setShowDeleteModal(true),
                })}
              />
            )}
          </div>
        </div>

        {/* Cover image (si el creador la subió) */}
        {pollData.coverImage && (
          <button
            type="button"
            onClick={() => setZoomImage({ url: pollData.coverImage, alt: pollData.title })}
            className="block w-full mb-4 sm:mb-6 rounded-2xl overflow-hidden cursor-zoom-in group"
            aria-label={`Ver imagen de ${pollData.title}`}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pollData.coverImage}
                alt={pollData.title}
                className="w-full h-40 sm:h-56 object-cover group-hover:opacity-95 transition-opacity"
              />
              <span className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/70 transition-colors">
                <Eye className="w-5 h-5 text-white" strokeWidth={2.2} />
              </span>
            </div>
          </button>
        )}

        {/* Countdown / closed banner */}
        {expired ? (
          <div className="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-center border bg-[var(--badge-neutral-bg)] border-[var(--border)]">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-[var(--text-muted)]" />
              <p className="text-lg sm:text-xl font-bold text-[var(--text)]">
                {t('poll.closedLabel')}
              </p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {pollData.closedAt ? t('poll.closedByCreator') : t('poll.closedByTime')}
            </p>
          </div>
        ) : (
          <div className="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-center border bg-[var(--primary-light)]/40 border-[var(--primary-light)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">{t('votes.timeRemaining')}</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">
              {formatTimeRemaining(timeRemaining)}
            </p>
          </div>
        )}

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
                <span className="sm:hidden">{t('ranking.reorderHint')}</span>
                <span className="hidden sm:inline">{t('ranking.dragToReorder')}</span>
              </p>
              {rankings.map((optionId, index) => {
                const option = pollData.options.find((o: any) => o.id === optionId);
                if (!option) return null;
                const hasImage = !!option.imageUrl;
                const isFirst = index === 0;
                const isLast = index === rankings.length - 1;

                return (
                  <div
                    key={option.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 sm:gap-3 bg-[var(--surface-2)] rounded-xl p-2.5 sm:p-4 sm:cursor-move transition-all border ${
                      draggedItem === index
                        ? 'opacity-50 border-[var(--primary)]'
                        : 'border-transparent hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    {hasImage && (
                      <button
                        type="button"
                        draggable={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomImage({ url: option.imageUrl, alt: option.title || '' });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-zoom-in relative group"
                        aria-label={`Ver ${option.title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={option.imageUrl}
                          alt={option.title || ''}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                        <span className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-sm">
                          <Eye className="w-3 h-3 text-white" strokeWidth={2.4} />
                        </span>
                      </button>
                    )}
                    {option.emoji && (
                      <span className="text-xl flex-shrink-0" aria-hidden>
                        {option.emoji}
                      </span>
                    )}
                    <span className="font-medium text-[var(--text)] flex-1 min-w-0 break-words text-sm sm:text-base">
                      {option.title}
                    </span>

                    {/* Controles mobile: up/down en pila vertical.
                        Visibles hasta sm (drag-and-drop no anda con dedos). */}
                    <div className="flex sm:hidden flex-col flex-shrink-0 -my-1">
                      <button
                        type="button"
                        draggable={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, -1);
                        }}
                        disabled={isFirst}
                        aria-label={t('ranking.moveUp')}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] disabled:opacity-25 active:bg-[var(--border)] transition-colors"
                      >
                        <ChevronUp className="w-5 h-5" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        draggable={false}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, 1);
                        }}
                        disabled={isLast}
                        aria-label={t('ranking.moveDown')}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] disabled:opacity-25 active:bg-[var(--border)] transition-colors"
                      >
                        <ChevronDown className="w-5 h-5" strokeWidth={2.4} />
                      </button>
                    </div>

                    {/* Handle de drag visible solo en desktop */}
                    <GripVertical className="hidden sm:block w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
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
              onZoomImage={(url, alt) => setZoomImage({ url, alt })}
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('poll.deletePoll')}
        subtitle={t('poll.deleteConfirm')}
        cancelText={t('poll.cancel')}
        confirmText={t('poll.delete')}
      />

      <ConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleCloseNow}
        title={t('poll.closeNowTitle')}
        subtitle={t('poll.closeNowConfirm')}
        cancelText={t('poll.cancel')}
        confirmText={t('poll.closeNowConfirmBtn')}
        variant="warning"
      />

      <EditTitleModal
        isOpen={showEditModal}
        initialTitle={pollData?.title || ''}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditTitle}
        title={t('poll.editTitle')}
        subtitle={t('poll.editTitleSubtitle')}
        cancelText={t('poll.cancel')}
        saveText={t('poll.save')}
        placeholder={t('poll.titlePlaceholder')}
      />

      <AnimatePresence>
        {zoomImage && (
          <ImageModal
            imageUrl={zoomImage.url}
            alt={zoomImage.alt}
            onClose={() => setZoomImage(null)}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

function buildOwnerItems({
  expired,
  t,
  onEdit,
  onClose,
  onDelete,
}: {
  expired: boolean;
  t: (k: string) => string;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
}): OwnerMenuItem[] {
  const items: OwnerMenuItem[] = [
    { label: t('poll.editTitle'), onClick: onEdit, variant: 'default' },
  ];
  if (!expired) {
    items.push({ label: t('poll.closeNow'), onClick: onClose, variant: 'warning' });
  }
  items.push({ label: t('poll.deletePoll'), onClick: onDelete, variant: 'danger', divider: true });
  return items;
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
        onClick={() => router.push(fallback)}
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
  onZoomImage,
}: {
  options: any[];
  expired: boolean;
  expiredTitle: string;
  expiredDesc: string;
  pointsLabel: string;
  onZoomImage: (url: string, alt: string) => void;
}) {
  const sorted = [...options].sort(
    (a: any, b: any) => (b.rankingScore || 0) - (a.rankingScore || 0)
  );
  const maxScore = Math.max(1, ...sorted.map((o: any) => o.rankingScore || 0));

  const sortedWithScore = sorted.filter((o) => (o.rankingScore || 0) > 0);
  const showPodium = expired && sortedWithScore.length > 0;

  const podiumEntries: PodiumEntry[] = showPodium
    ? sortedWithScore.slice(0, 3).map((o: any) => ({
        id: o.id,
        title: o.title,
        emoji: o.emoji,
        imageUrl: o.imageUrl,
        primary: `${o.rankingScore || 0} ${pointsLabel}`,
      }))
    : [];
  const podiumIds = new Set(podiumEntries.map((e) => e.id));
  const listOptions = showPodium ? sorted.filter((o) => !podiumIds.has(o.id)) : sorted;

  return (
    <div className="space-y-3">
      {expired && (
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">{expiredTitle}</h2>
          <p className="text-sm text-[var(--text-muted)]">{expiredDesc}</p>
        </div>
      )}
      {showPodium && (
        <WinnerPodium entries={podiumEntries} onZoomImage={onZoomImage} />
      )}
      {listOptions.map((option: any) => {
        const index = sorted.indexOf(option);
        const score = option.rankingScore || 0;
        const percentage = Math.round((score / maxScore) * 100);
        const isWinner = index === 0 && score > 0;
        const hasImage = !!option.imageUrl;

        return (
          <div
            key={option.id}
            className={`rounded-xl border overflow-hidden ${
              isWinner
                ? 'bg-[var(--surface-2)] border-[var(--primary-light)]'
                : 'bg-[var(--surface-2)] border-[var(--border)]'
            }`}
          >
            <div className="flex items-stretch">
              {hasImage && (
                <button
                  type="button"
                  onClick={() => onZoomImage(option.imageUrl, option.title || '')}
                  className="relative w-20 sm:w-24 flex-shrink-0 self-stretch cursor-zoom-in group"
                  aria-label={`Ver ${option.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={option.imageUrl}
                    alt={option.title || ''}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                  </span>
                </button>
              )}
              <div className="flex-1 min-w-0 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    {isWinner && <span aria-hidden>👑</span>}
                    {option.emoji && (
                      <span className="text-lg flex-shrink-0" aria-hidden>
                        {option.emoji}
                      </span>
                    )}
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
