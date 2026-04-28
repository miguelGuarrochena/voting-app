'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Star, Share2, ArrowLeft, ExternalLink, Check, Eye, Lock } from 'lucide-react';

import { isTerminal, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses, deletePoll, closePoll, updatePollTitle } from '@/lib/db';
import { addMyPoll, findMyPoll, removeMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
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
import { RatingsComingSoon } from '@/components/ratings/ComingSoon';
import { FEATURES } from '@/lib/features';

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
  const getCaptchaToken = useTurnstile('rating_submit');

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
  const [isCreator, setIsCreator] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ url: string; alt: string } | null>(null);
  const [wasJustCreated, setWasJustCreated] = useState(justCreated);

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
      setExpired(isTerminal(new Date(data.expiresAt), data.closedAt));
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

      const my = findMyPoll(token);
      setIsCreator(my?.role === 'creator');

      const responses = await getPollResponses(token);
      setResponses(responses);
      // Recomputar ratings desde las responses ya guardadas.
      // Si no hacemos esto, al abrir una page con datos previos se ven
      // todas las opciones en 0 hasta que entra un evento de realtime.
      setPollData((prev: any) =>
        prev ? { ...prev, options: recomputeRatings(prev.options, responses) } : prev
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
            prev ? { ...prev, options: recomputeRatings(prev.options, newResponses) } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  // Confeti al pasar a expirado (si al menos una opción tiene ratings)
  useEffect(() => {
    if (expired && pollData) {
      const hasRatings = (pollData.options ?? []).some(
        (o: any) => (o.ratingCount || 0) > 0
      );
      if (hasRatings) fireWinnerConfetti(token);
    }
  }, [expired, pollData, token]);

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
    const captchaToken = await getCaptchaToken();
    const ok = await submitResponse(token, username || 'Anonymous', { ratings }, captchaToken);
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

  const handleDelete = async () => {
    const ok = await deletePoll(token);
    if (!ok) return;
    removeMyPoll(token);
    toast.success(t('common.removed'));
    router.push('/ratings');
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

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      </PageLayout>
    );
  }

  if (!FEATURES.ratings) return <RatingsComingSoon />;

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
        {/* Breadcrumb */}
        <button
          onClick={() => {
            if (isCreator && !hasVotedState && wasJustCreated) {
              router.push(`/ratings/${token}/edit`);
            } else {
              safeBack(router, '/ratings');
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isCreator && !hasVotedState && wasJustCreated ? t('poll.edit') : t('ratings.title')}</span>
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
                  onZoomImage={(url, alt) => setZoomImage({ url, alt })}
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
              onZoomImage={(url, alt) => setZoomImage({ url, alt })}
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

function RatingItem({
  option,
  value,
  onChange,
  starLabel,
  starsLabel,
  notRatedLabel,
  onZoomImage,
}: {
  option: any;
  value: number;
  onChange: (rating: number) => void;
  starLabel: string;
  starsLabel: string;
  notRatedLabel: string;
  onZoomImage: (url: string, alt: string) => void;
}) {
  return (
    <div className="bg-[var(--surface-2)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      {option.imageUrl && (
        <button
          type="button"
          onClick={() => onZoomImage(option.imageUrl, option.title || '')}
          className="block w-full cursor-zoom-in group"
          aria-label={`Ver ${option.title}`}
        >
          <div className="relative mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.imageUrl}
              alt={option.title}
              className="w-full h-32 sm:h-40 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
            />
            <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/70 transition-colors">
              <Eye className="w-4 h-4 text-white" strokeWidth={2.3} />
            </span>
          </div>
        </button>
      )}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {option.emoji && (
            <span className="text-xl flex-shrink-0" aria-hidden>
              {option.emoji}
            </span>
          )}
          <span className="font-semibold text-[var(--text)] text-base">{option.title}</span>
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
  onZoomImage,
}: {
  options: any[];
  expired: boolean;
  expiredTitle: string;
  expiredDesc: string;
  countLabel: string;
  avgLabel: string;
  onZoomImage: (url: string, alt: string) => void;
}) {
  const sorted = [...options].sort((a: any, b: any) => {
    const avgA = a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0;
    const avgB = b.ratingCount > 0 ? b.totalRating / b.ratingCount : 0;
    return avgB - avgA;
  });

  const sortedWithRatings = sorted.filter((o) => (o.ratingCount || 0) > 0);
  const showPodium = expired && sortedWithRatings.length > 0;

  const podiumEntries: PodiumEntry[] = showPodium
    ? sortedWithRatings.slice(0, 3).map((o: any) => {
        const avg = o.ratingCount > 0 ? o.totalRating / o.ratingCount : 0;
        return {
          id: o.id,
          title: o.title,
          emoji: o.emoji,
          imageUrl: o.imageUrl,
          primary: `⭐ ${avg.toFixed(1)}`,
          secondary: `${o.ratingCount || 0} ${countLabel}`,
        };
      })
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
              <button
                type="button"
                onClick={() => onZoomImage(option.imageUrl, option.title || '')}
                className="block w-full cursor-zoom-in group"
                aria-label={`Ver ${option.title}`}
              >
                <div className="relative mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={option.imageUrl}
                    alt={option.title}
                    className="w-full h-32 sm:h-36 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                  />
                  <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/70 transition-colors">
                    <Eye className="w-4 h-4 text-white" strokeWidth={2.3} />
                  </span>
                </div>
              </button>
            )}
            <div className="mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {isWinner && <span aria-hidden>👑</span>}
                {option.emoji && (
                  <span className="text-lg flex-shrink-0" aria-hidden>
                    {option.emoji}
                  </span>
                )}
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
