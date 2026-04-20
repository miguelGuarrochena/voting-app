'use client';

import { useState, useEffect, use } from 'react';
import { useUsername } from '@/context/UsernameContext';
import { getPollData, storePollData, hasVotedInDuel, markDuelVote, getDuelVote, deleteTournamentData, isExpired } from '@/lib/token';
import { VersusTournament } from '@/types/versus';
import { BracketView } from '@/components/versus/BracketView';
import { CelebrationScreen } from '@/components/versus/CelebrationScreen';
import { ExpiredTournament } from '@/components/versus/ExpiredTournament';
import { selectWinner, calculateCompletedBracket, isBracketComplete, getBracketProgress, createUserBracket } from '@/lib/bracket';
import { Swords, Clock, AlertTriangle, Share2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Toast from '@/components/ui/Toast';
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
  const [tournament, setTournament] = useState<VersusTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [userBracket, setUserBracket] = useState<any>(null); // User's current selections
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  // Load tournament data
  useEffect(() => {
    // Show toast if just created
    if (justCreated) {
      setToastMessage('Torneo creado');
      setShowToast(true);
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

    // Update user bracket with selection
    const updatedBracket = selectWinner(
      userBracket || tournament.bracket,
      duelId,
      winner
    );

    // Calculate completed bracket to advance winners to next rounds
    const calculatedBracket = calculateCompletedBracket(updatedBracket);

    setUserBracket(calculatedBracket);
  };

  const handleSubmitBracket = () => {
    if (!tournament || !username || !userBracket) return;

    if (!isBracketComplete(userBracket)) {
      setToastMessage('Completa todos los duelos antes de enviar');
      setShowToast(true);
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
      setToastMessage('Link copiado');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
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
        text: 'Completado',
        bgColor: '#1a5c3a',
        textColor: '#ffffff',
        showIcon: false,
      };
    }

    if (isTournamentExpired) {
      return {
        text: 'Expirado',
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
          <p className="text-[var(--text-muted)]">Cargando torneo...</p>
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
    <div className="min-h-screen bg-[var(--bg)] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/versus"
                className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              </Link>
              <Swords className="w-6 h-6 text-[var(--primary)]" />
              <div>
                <h1 className="text-lg font-bold text-[var(--text)]">{tournament.title}</h1>
                <p className="text-xs text-[var(--text-muted)]">
                  por {tournament.createdBy} • {tournament.options.length} opciones
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress */}
              {!userBracket && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] rounded-full">
                  <div className="w-24 bg-[var(--bg)] rounded-full h-2">
                    <div 
                      className="bg-[var(--primary)] h-2 rounded-full transition-all" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{progress}%</span>
                </div>
              )}

              {/* Submit Button */}
              {!userBracket && progress === 100 && (
                <button
                  onClick={handleSubmitBracket}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium"
                >
                  <span>Enviar Bracket</span>
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium"
              >
                <Share2 size={18} />
                Compartir
              </button>

              {/* Status Chip */}
              {statusInfo && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    statusInfo.showIcon ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: statusInfo.bgColor,
                    color: statusInfo.textColor,
                  }}
                >
                  {statusInfo.showIcon ? <AlertTriangle size={16} /> : <Clock size={16} />}
                  {statusInfo.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bracket */}
        <div className="flex items-center justify-center">
          <div className="w-full overflow-x-auto">
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
          onShareResult={() => {}}
        />
      )}
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
