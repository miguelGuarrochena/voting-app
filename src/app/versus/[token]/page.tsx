'use client';

import { useState, useEffect, use, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { isExpired } from '@/lib/token';
import { getTournament, updateTournamentBracket, submitDuelVote, getDuelVotes, hasVotedInDuel, deleteTournament, closeTournament, updateTournamentTitle } from '@/lib/db';
import { addMyPoll, findMyPoll, removeMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
import { generateBracket } from '@/lib/bracket';
import { VersusTournament, VersusOption } from '@/types/versus';
import { supabase } from '@/lib/supabase';
import { PageLayout } from '@/components/layout/PageLayout';
import { BracketView } from '@/components/versus/BracketView';
import { CelebrationScreen } from '@/components/versus/CelebrationScreen';
import { ExpiredTournament } from '@/components/versus/ExpiredTournament';
import { selectWinner, calculateCompletedBracket, isBracketComplete, getBracketProgress, createUserBracket } from '@/lib/bracket';
import { useRouter } from 'next/navigation';
import { Swords, Clock, AlertTriangle, Share2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OwnerMenu, OwnerMenuItem } from '@/components/common/OwnerMenu';
import ConfirmModal from '@/components/modals/ConfirmModal';
import EditTitleModal from '@/components/modals/EditTitleModal';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function VersusTournamentPage({ params }: PageProps) {
  const router = useRouter();
  const { token } = use(params);
  const { username } = useUsername();
  const { t } = useLanguage();
  const [tournament, setTournament] = useState<VersusTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [userBracket, setUserBracket] = useState<any>(null); // User's current selections
  const [shareResultText, setShareResultText] = useState(t('versus.shareResult'));
  const [isCreator, setIsCreator] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  // Load tournament data
  useEffect(() => {
    const loadTournament = async () => {
      // Show toast if just created
      if (justCreated) {
        toast(t('versus.tournamentCreated'));
        window.history.replaceState({}, '', `/versus/${token}`);
      }

      const data = await getTournament(token);
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTournament(data);
      setLoading(false);

      // Guardar en "mis torneos" como participante.
      addMyPoll({
        token,
        type: 'versus',
        title: data.title,
        role: 'participant',
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      });

      const my = findMyPoll(token);
      setIsCreator(my?.role === 'creator');

      // Calculate time remaining
      const expiresAt = new Date(data.expiresAt);
      const now = new Date();
      setTimeRemaining(Math.max(0, expiresAt.getTime() - now.getTime()));

      // Load user's bracket if exists
      if (username && data.userBrackets && data.userBrackets[username]) {
        setUserBracket(data.userBrackets[username]);
      }
    };

    loadTournament();

    // Set up Realtime subscription for tournament updates
    const tournamentChannel = supabase
      .channel('tournament-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tournaments',
        filter: `token=eq.${token}`
      }, async (payload) => {
        const data = await getTournament(token);
        if (data) {
          setTournament(data);
        }
      })
      .subscribe();

    // Set up Realtime subscription for duel votes
    const duelVotesChannel = supabase
      .channel('duel-votes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'duel_votes',
        filter: `tournament_token=eq.${token}`
      }, async (payload) => {
        // Reload tournament data to get updated vote counts
        const data = await getTournament(token);
        if (data) {
          setTournament(data);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tournamentChannel);
      supabase.removeChannel(duelVotesChannel);
    };
  }, [token, username]);

  // Countdown timer
  useEffect(() => {
    if (!tournament) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(tournament.expiresAt);
      const now = new Date();
      const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  const handleSelectWinner = (duelId: string, winner: any) => {
    if (!tournament) return;

    const currentBracket = userBracket || tournament.bracket;

    // Find which round this duel belongs to
    let targetRound = -1;
    for (const round of currentBracket.rounds) {
      for (const duel of round.duels) {
        if (duel.id === duelId) {
          targetRound = round.roundNumber;
          break;
        }
      }
      if (targetRound !== -1) break;
    }

    // Check if previous round is complete (except for round 1)
    if (targetRound > 1) {
      const previousRound = currentBracket.rounds[targetRound - 2];
      const isPreviousRoundComplete = previousRound.duels.every((d: any) => d.selectedWinner !== null);
      if (!isPreviousRoundComplete) {
        toast('Completa la ronda anterior primero');
        return;
      }
    }

    // Update user bracket with selection
    const updatedBracket = selectWinner(currentBracket, duelId, winner);

    // Calculate completed bracket to advance winners to next rounds
    const calculatedBracket = calculateCompletedBracket(updatedBracket);

    setUserBracket(calculatedBracket);
  };

  const handleSubmitBracket = async () => {
    if (!tournament || !username || !userBracket) return;

    if (!isBracketComplete(userBracket)) {
      toast(t('versus.completeAllDuels'));
      return;
    }

    // Create completed user bracket
    const completedUserBracket = createUserBracket(username, userBracket);

    // Update tournament bracket in Supabase
    const success = await updateTournamentBracket(token, completedUserBracket.bracket);

    if (!success) {
      toast.error('Error al enviar tu bracket');
      return;
    }

    // Update local state
    setUserBracket(completedUserBracket.bracket);
    setShowCelebration(true);

    // Reload tournament to get updated data
    const updatedTournament = await getTournament(token);
    if (updatedTournament) {
      setTournament(updatedTournament);
    }
  };

  const getProgress = () => {
    if (!userBracket) return 0;
    return getBracketProgress(userBracket);
  };

  const getUserSelection = (duelId: string): any => {
    if (!userBracket) return null;
    for (const round of userBracket.rounds) {
      for (const duel of round.duels) {
        if (duel.id === duelId) {
          return duel.selectedWinner;
        }
      }
    }
    return null;
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: tournament?.title, url });
        return;
      }
    } catch {
      /* cancelado por el user */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(t('versus.copied'));
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async () => {
    const ok = await deleteTournament(token);
    if (!ok) return;
    removeMyPoll(token);
    toast.success(t('common.removed'));
    router.push('/versus');
  };

  const handleCloseNow = async () => {
    const ok = await closeTournament(token);
    if (!ok) return;
    toast.success(t('poll.closedToast'));
    // Refrescamos el tournament para reflejar status=expired
    const updated = await getTournament(token);
    if (updated) setTournament(updated);
  };

  const handleEditTitle = async (newTitle: string): Promise<boolean> => {
    const ok = await updateTournamentTitle(token, newTitle);
    if (!ok) return false;
    toast.success(t('poll.titleUpdated'));
    setTournament((prev) => prev ? { ...prev, title: newTitle } : prev);
    return true;
  };

  const handleShareResult = async () => {
    if (!displayBracket.champion || !tournament || !bracketRef.current) return;

    try {
      setShareResultText(t('versus.generating'));

      // Capture bracket as image
      const canvas = await html2canvas(bracketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Copy image to clipboard
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setShareResultText(t('versus.copied'));
          setTimeout(() => setShareResultText(t('versus.shareResult')), 2000);
        } catch (err) {
          console.error('Failed to copy image:', err);
          // Fallback: download the image
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `bracket-${tournament.title}.png`;
          link.href = url;
          link.click();
          setShareResultText(t('versus.downloaded'));
          setTimeout(() => setShareResultText(t('versus.shareResult')), 2000);
        }
      });
    } catch (err) {
      console.error('Failed to capture bracket:', err);
      setShareResultText(t('versus.error'));
      setTimeout(() => setShareResultText(t('versus.shareResult')), 2000);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expired';
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Get status chip info
  const getStatusInfo = () => {
    if (!tournament) return null;

    const isTournamentExpired = isExpired(new Date(tournament.expiresAt));
    const isCompleted = userBracket && isBracketComplete(userBracket);

    if (isCompleted) {
      return {
        text: t('versus.completed'),
        bgColor: '#1a5c3a',
        textColor: '#ffffff',
        showIcon: false,
      };
    }

    if (isTournamentExpired) {
      return {
        text: t('versus.expired'),
        bgColor: '#2a2a2a',
        textColor: '#a0a0a0',
        showIcon: false,
      };
    }

    const hours = timeRemaining / (1000 * 60 * 60);
    const isUrgent = hours < 2;

    return {
      text: formatTimeRemaining(timeRemaining),
      bgColor: isUrgent ? '#7a3200' : '#1a5c3a',
      textColor: '#ffffff',
      showIcon: isUrgent,
    };
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

  if (notFound) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => safeBack(router, '/versus')}
              className="hidden sm:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">{t('common.back')}</span>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Tournament not found</h2>
            <p className="text-[var(--text-muted)] mb-6">This tournament may have been deleted or the link is invalid.</p>
            <Link href="/" className="text-[var(--primary)] hover:underline">
              Go back home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!tournament) return null;

  const statusInfo = getStatusInfo();
  const progress = getProgress();
  const displayBracket = userBracket || tournament.bracket;

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <button
          onClick={() => safeBack(router, '/versus')}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('versus.title')}</span>
        </button>

        {/* Header: título + acciones */}
        <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
            <Swords className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-1" />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text)] break-words">
                {tournament.title}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                {t('versus.by')} {tournament.createdBy} • {tournament.options.length} {t('versus.options')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status Chip */}
            {statusInfo && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                  statusInfo.showIcon ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: statusInfo.bgColor,
                  color: statusInfo.textColor,
                }}
              >
                {statusInfo.showIcon ? <AlertTriangle size={14} /> : <Clock size={14} />}
                <span className="hidden sm:inline">{statusInfo.text}</span>
                <span className="sm:hidden">{statusInfo.text.split(' ')[0]}</span>
              </div>
            )}

            {/* Share Result Button (when bracket is completed) */}
            {userBracket && displayBracket.champion && (
              <button
                onClick={handleShareResult}
                className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 transition-colors rounded-full sm:rounded-lg font-medium text-sm"
                aria-label={shareResultText}
              >
                <Share2 size={14} />
                <span className="hidden sm:inline ml-1.5">{shareResultText}</span>
              </button>
            )}

            {/* Share Button */}
            {!displayBracket.champion && (
              <button
                onClick={handleShare}
                className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors rounded-full sm:rounded-lg font-medium text-sm"
                aria-label={t('versus.share')}
              >
                <Share2 size={14} />
                <span className="hidden sm:inline ml-1.5">{t('versus.share')}</span>
              </button>
            )}

            {/* Submit Button */}
            {!userBracket && progress > 0 && progress === 100 && (
              <button
                onClick={handleSubmitBracket}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{t('versus.submitBracket')}</span>
                <span className="sm:hidden">{t('versus.submit')}</span>
              </button>
            )}

            {/* Owner menu */}
            {isCreator && (
              <OwnerMenu
                ariaLabel={t('common.actions') || 'Acciones'}
                items={buildOwnerItems({
                  expired: isExpired(new Date(tournament.expiresAt)),
                  t,
                  onEdit: () => setShowEditModal(true),
                  onClose: () => setShowCloseModal(true),
                  onDelete: () => setShowDeleteModal(true),
                })}
              />
            )}
          </div>
        </div>

        {/* Countdown Banner */}
        <div className="bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-[var(--text-muted)] mb-1">{t('versus.timeRemaining')}</p>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {formatTimeRemaining(timeRemaining)}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8">
          <div ref={bracketRef}>
            {/* Header for image (hidden on mobile) */}
            <div className="hidden md:block text-center mb-6 pb-4 border-b border-[var(--border)]">
              <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{tournament.title}</h2>
              <p className="text-sm text-[var(--text-muted)]">
                {t('versus.bracketOf')} {username || t('versus.anonymous')} • {new Date().toLocaleDateString()}
              </p>
            </div>
            <BracketView
              bracket={displayBracket}
              votesToWin={1}
              currentRound={0}
              username={username}
              onVote={handleSelectWinner}
              getUserVote={getUserSelection}
            />
          </div>
        </div>
      </div>

      {/* Celebration Screen */}
      {showCelebration && displayBracket.champion && (
        <CelebrationScreen
          champion={displayBracket.champion}
          tournamentTitle={tournament.title}
          onShareResult={handleShareResult}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('poll.deletePoll')}
        subtitle={t('poll.deleteConfirm')}
        cancelText={t('poll.cancel')}
        confirmText={t('poll.delete')}
      />

      {/* Close-now confirmation */}
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

      {/* Edit title */}
      <EditTitleModal
        isOpen={showEditModal}
        initialTitle={tournament?.title || ''}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditTitle}
        title={t('poll.editTitle')}
        subtitle={t('poll.editTitleSubtitle')}
        cancelText={t('poll.cancel')}
        saveText={t('poll.save')}
        placeholder={t('poll.titlePlaceholder')}
      />
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
