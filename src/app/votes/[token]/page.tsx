'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Share2, ArrowLeft, Check, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { isTerminal, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { Lock } from 'lucide-react';
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
import { WinnerPodium, PodiumEntry } from '@/components/results/WinnerPodium';
import { fireWinnerConfetti } from '@/lib/confetti';

// ------------------------------------------------------------
//  VOTE — Details by token
//  UX:
//   - Tap a card → it's selected (green check + border).
//   - "Change" before sending lets you deselect.
//   - Submit: sends the vote and leaves live results below.
// ------------------------------------------------------------

export default function VoteTokenPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { username } = useUsername();
  const { t } = useLanguage();
  const getCaptchaToken = useTurnstile('vote_submit');

  const token = params.token as string;
  const justCreated = searchParams.get('created') === 'true';

  const [pollData, setPollData] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
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

  // ---------- cargar poll + subscripción realtime ----------
  useEffect(() => {
    const loadPoll = async () => {
      if (justCreated) {
        toast.success(t('votes.createdToast'));
        window.history.replaceState({}, '', `/votes/${token}`);
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
        type: 'vote',
        title: data.title,
        role: 'participant',
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      });

      // Know if the current user is the creator (we save it locally when creating)
      const my = findMyPoll(token);
      setIsCreator(my?.role === 'creator');

      const responses = await getPollResponses(token);
      setResponses(responses);
      // Recompute votes from the responses already saved.
      // Without this, options show 0 votes when opening, until
      // a realtime event comes in.
      setPollData((prev: any) =>
        prev ? { ...prev, options: recomputeVotes(prev.options, responses) } : prev
      );
      const userResponse = responses.find((r) => r.username === username);
      if (userResponse) {
        setHasVotedState(true);
        setSelectedOption(userResponse.response?.optionId ?? null);
      }

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

    loadPoll();

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
            prev ? { ...prev, options: recomputeVotes(prev.options, newResponses) } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  // Confetti when the poll expires (natural or "Close now")
  useEffect(() => {
    if (expired && pollData) {
      const hasWinner = (pollData.options ?? []).some((o: any) => (o.votes || 0) > 0);
      if (hasWinner) fireWinnerConfetti(token);
    }
  }, [expired, pollData, token]);

  // ---------- handlers ----------
  const handleVote = async () => {
    if (!selectedOption || !pollData || submitting) return;
    setSubmitting(true);
    const captchaToken = await getCaptchaToken();
    const ok = await submitResponse(token, username || 'Anonymous', { optionId: selectedOption }, captchaToken);
    setSubmitting(false);

    if (!ok) return; // db.ts ya mostró el toast con el error real

    setHasVotedState(true);
    toast.success(t('votes.submittedToast'));

    const newResponses = await getPollResponses(token);
    setResponses(newResponses);
    setPollData((prev: any) => ({
      ...prev,
      options: recomputeVotes(prev.options, newResponses),
    }));
  };

  const handleDelete = async () => {
    const ok = await deletePoll(token);
    if (!ok) return; // db.ts ya mostró el toast
    removeMyPoll(token);
    toast.success(t('common.removed'));
    router.push('/votes');
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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: pollData?.title, url });
        return;
      }
    } catch {
      // usuario canceló, seguimos al clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.copied'));
    } catch {
      toast.error(t('common.copyFail'));
    }
  };

  // ---------- render ----------
  if (loading) return <FullPageSpinner />;

  if (error === 'not_found') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <HeaderBackOnly router={router} fallback="/votes" label={t('common.back')} />
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('votes.notFound')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('votes.notFoundDesc')}</p>
            <Link href="/" className="text-[var(--primary)] hover:underline font-medium">
              {t('votes.goHome')}
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalVotes = (pollData?.options ?? []).reduce(
    (sum: number, opt: any) => sum + (opt.votes || 0),
    0
  );

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <button
          onClick={() => {
            if (isCreator && !hasVotedState && wasJustCreated) {
              router.push(`/votes/${token}/edit`);
            } else {
              safeBack(router, '/votes');
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isCreator && !hasVotedState && wasJustCreated ? t('poll.edit') : t('votes.title')}</span>
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

        {/* Post-vote banner */}
        {hasVotedState && !expired && (
          <div className="flex items-center gap-2 bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] rounded-xl px-4 py-3 mb-4 sm:mb-6 text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{t('votes.alreadyVoted')}</span>
          </div>
        )}

        {/* Main card */}
        <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-4 sm:p-6 md:p-8">
          {pollData.description && (
            <p className="text-[var(--text-muted)] mb-4 sm:mb-6">{pollData.description}</p>
          )}

          {!hasVotedState && !expired ? (
            <VoteForm
              options={pollData.options}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              onSubmit={handleVote}
              submitting={submitting}
              pickLabel={t('votes.pickAnOption')}
              submitLabel={t('votes.submitVote')}
              changeLabel={t('votes.change')}
              onZoomImage={(url, alt) => setZoomImage({ url, alt })}
            />
          ) : (
            <ResultsList
              options={pollData.options}
              totalVotes={totalVotes}
              userVotedOption={selectedOption}
              expired={expired}
              expiredTitle={t('votes.expiredTitle')}
              expiredDesc={t('votes.expiredDesc')}
              votesLabel={t('votes.votes')}
              onZoomImage={(url, alt) => setZoomImage({ url, alt })}
            />
          )}
        </div>

        {/* Participants */}
        {responses.length > 0 && (hasVotedState || expired) && (
          <div className="mt-4 sm:mt-6 px-2">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2">
              {t('votes.voters')} ({responses.length})
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
            href="/create?type=vote"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] underline-offset-4 hover:underline"
          >
            {t('votes.createYourOwn')}
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

// Arma los items del menú owner según el estado actual (expired, etc.)
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

// --------- Voting form with checkmark ---------
// Shows image (if any) + emoji + title. Tap on the image zooms;
// tap anywhere else selects the option.
function VoteForm({
  options,
  selectedOption,
  setSelectedOption,
  onSubmit,
  submitting,
  pickLabel,
  submitLabel,
  changeLabel,
  onZoomImage,
}: {
  options: any[];
  selectedOption: string | null;
  setSelectedOption: (id: string | null) => void;
  onSubmit: () => void;
  submitting: boolean;
  pickLabel: string;
  submitLabel: string;
  changeLabel: string;
  onZoomImage: (url: string, alt: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)] font-medium">{pickLabel}</p>
      <div className="space-y-2.5">
        {options.map((option: any) => {
          const isSelected = selectedOption === option.id;
          const hasImage = !!option.imageUrl;
          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => setSelectedOption(isSelected ? null : option.id)}
              whileTap={{ scale: 0.99 }}
              className={`relative w-full rounded-xl border-2 transition-all text-left overflow-hidden ${
                isSelected
                  ? 'border-[var(--success)] bg-[var(--badge-success-bg)] shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface-2)]'
              }`}
            >
              <div className="flex items-stretch">
                {hasImage && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomImage(option.imageUrl, option.title || '');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onZoomImage(option.imageUrl, option.title || '');
                      }
                    }}
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
                  </span>
                )}

                <div className="flex items-center gap-3 flex-1 min-w-0 p-4">
                  {option.emoji && (
                    <span className="text-2xl flex-shrink-0" aria-hidden>
                      {option.emoji}
                    </span>
                  )}
                  <span className="font-medium text-[var(--text)] flex-1 min-w-0 break-words">
                    {option.title}
                  </span>

                  {/* Checkmark animado */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-8 h-8 rounded-full bg-[var(--success)] flex items-center justify-center flex-shrink-0 shadow-sm"
                        aria-hidden
                      >
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={onSubmit}
        disabled={!selectedOption || submitting}
        className="w-full bg-[var(--primary)] text-white py-3 sm:py-3.5 rounded-xl font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? '…' : submitLabel}
      </button>

    </div>
  );
}

// --------- Lista de resultados (barras) ---------
function ResultsList({
  options,
  totalVotes,
  userVotedOption,
  expired,
  expiredTitle,
  expiredDesc,
  votesLabel,
  onZoomImage,
}: {
  options: any[];
  totalVotes: number;
  userVotedOption: string | null;
  expired: boolean;
  expiredTitle: string;
  expiredDesc: string;
  votesLabel: string;
  onZoomImage: (url: string, alt: string) => void;
}) {
  const sorted = [...options].sort(
    (a: any, b: any) => (b.votes || 0) - (a.votes || 0)
  );

  // Only options that actually received votes make it onto the podium.
  const sortedWithVotes = sorted.filter((o) => (o.votes || 0) > 0);
  const showPodium = expired && sortedWithVotes.length > 0;

  const podiumEntries: PodiumEntry[] = showPodium
    ? sortedWithVotes.slice(0, 3).map((o: any) => {
        const votes = o.votes || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        return {
          id: o.id,
          title: o.title,
          emoji: o.emoji,
          imageUrl: o.imageUrl,
          primary: `${votes} ${votesLabel}`,
          secondary: `${pct}%`,
        };
      })
    : [];
  // El resto (incluye empatados con 0 votos) va en la lista.
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
        return renderOptionRow(option, index);
      })}
    </div>
  );

  function renderOptionRow(option: any, index: number) {
        const votes = option.votes || 0;
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const isUserChoice = option.id === userVotedOption;
        const isWinner = index === 0 && votes > 0;
        const hasImage = !!option.imageUrl;

        return (
          <div
            key={option.id}
            className={`rounded-xl border transition-all overflow-hidden ${
              isUserChoice
                ? 'bg-[var(--badge-success-bg)] border-[var(--success)]'
                : isWinner
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
                    {isWinner && <span aria-hidden>👑</span>}
                    {option.emoji && (
                      <span className="text-lg flex-shrink-0" aria-hidden>
                        {option.emoji}
                      </span>
                    )}
                    <span className="font-medium text-[var(--text)] truncate">{option.title}</span>
                    {isUserChoice && (
                      <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-sm text-[var(--text-muted)] font-semibold flex-shrink-0">
                    {votes} {votesLabel} · {percentage}%
                  </span>
                </div>
                <div className="w-full bg-[var(--progress-track)] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUserChoice ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
  }
}

// --------- Helpers ---------
function recomputeVotes(options: any[], responses: any[]) {
  const counts: Record<string, number> = {};
  responses.forEach((r) => {
    const id = r.response?.optionId;
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  return options.map((opt: any) => ({ ...opt, votes: counts[opt.id] || 0 }));
}
