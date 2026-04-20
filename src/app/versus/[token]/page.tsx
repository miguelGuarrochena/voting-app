'use client';

import { useState, useEffect, use, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { getPollData, storePollData, hasVotedInDuel, markDuelVote, getDuelVote, deleteTournamentData, isExpired } from '@/lib/token';
import { VersusTournament } from '@/types/versus';
import { BracketView } from '@/components/versus/BracketView';
import { CelebrationScreen } from '@/components/versus/CelebrationScreen';
import { ExpiredTournament } from '@/components/versus/ExpiredTournament';
import { selectWinner, calculateCompletedBracket, isBracketComplete, getBracketProgress, createUserBracket } from '@/lib/bracket';
import { Swords, Clock, AlertTriangle, Share2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function VersusTournamentPage({ params }: PageProps) {
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
  const bracketRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  // Load tournament data
  useEffect(() => {
    // Show toast if just created
    if (justCreated) {
      toast(t('versus.tournamentCreated'));
      window.history.replaceState({}, '', `/versus/${token}`);
    }

    const loadTournament = () => {
      const data = getPollData(token, 'versus');
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTournament(data);
      setLoading(false);

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

  const handleSubmitBracket = () => {
    if (!tournament || !username || !userBracket) return;

    if (!isBracketComplete(userBracket)) {
      toast(t('versus.completeAllDuels'));
      return;
    }

    // Create completed user bracket
    const completedUserBracket = createUserBracket(username, userBracket);

    // Save to tournament
    const updatedTournament = {
      ...tournament,
      userBrackets: {
        ...tournament.userBrackets,
        [username]: completedUserBracket,
      },
    };

    storePollData(token, updatedTournament, 'versus');
    setTournament(updatedTournament);
    setUserBracket(completedUserBracket.bracket);
    setShowCelebration(true);
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
      await navigator.clipboard.writeText(url);
      toast(t('versus.copied'));
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
      <div className="min-h-screen bg-[var(--bg)] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⚔️</div>
          <p className="text-[var(--text-muted)]">{t('versus.loadingTournament')}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <ExpiredTournament />;
  }

  if (!tournament) return null;

  const statusInfo = getStatusInfo();
  const progress = getProgress();
  const displayBracket = userBracket || tournament.bracket;

  return (
    <div className="min-h-screen bg-[var(--bg)] md:pt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/versus"
                className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              </Link>
              <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">{tournament.title}</h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('versus.by')} {tournament.createdBy} • {tournament.options.length} {t('versus.options')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Status Chip */}
              {statusInfo && (
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
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
                  className="flex items-center gap-1.5 px-2 sm:px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-colors font-medium text-xs sm:text-sm flex-shrink-0"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">{shareResultText}</span>
                  <span className="sm:hidden">Resultado</span>
                </button>
              )}

              {/* Share Button */}
              {!displayBracket.champion && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium text-xs sm:text-sm flex-shrink-0"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">{t('versus.share')}</span>
                  <span className="sm:hidden">{t('versus.comp')}</span>
                </button>
              )}

              {/* Submit Button */}
              {!userBracket && progress > 0 && progress === 100 && (
                <button
                  onClick={handleSubmitBracket}
                  className="flex items-center gap-1.5 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium text-xs sm:text-sm flex-shrink-0"
                >
                  <span className="hidden sm:inline">{t('versus.submitBracket')}</span>
                  <span className="sm:hidden">{t('versus.submit')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bracket */}
        <div className="flex items-center justify-center">
          <div className="w-full">
            <div ref={bracketRef} className="bg-white p-2 sm:p-4 md:p-8 rounded-2xl border-2 border-gray-300 overflow-visible">
              {/* Header for image (hidden on mobile) */}
              <div className="hidden md:block text-center mb-6 pb-4 border-b border-gray-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{tournament.title}</h2>
                <p className="text-sm text-gray-600">
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
      </div>

      {/* Celebration Screen */}
      {showCelebration && displayBracket.champion && (
        <CelebrationScreen
          champion={displayBracket.champion}
          tournamentTitle={tournament.title}
          onShareResult={handleShareResult}
        />
      )}
    </div>
  );
}
