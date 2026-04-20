'use client';

import { useState, useEffect } from 'react';
import { useUsername } from '@/context/UsernameContext';
import { getPollData, storePollData, hasVotedInDuel, markDuelVote, getDuelVote, deleteTournamentData, isExpired } from '@/lib/token';
import { VersusTournament } from '@/types/versus';
import { BracketView } from '@/components/versus/BracketView';
import { CelebrationScreen } from '@/components/versus/CelebrationScreen';
import { ExpiredTournament } from '@/components/versus/ExpiredTournament';
import { voteInDuel, isDuelWon, isRoundComplete, advanceToNextRound, handleExpiration } from '@/lib/bracket';
import { Swords, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageProps {
  params: {
    token: string;
  };
}

export default function VersusTournamentPage({ params }: PageProps) {
  const { token } = params;
  const { username } = useUsername();
  const [tournament, setTournament] = useState<VersusTournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  // Load tournament data
  useEffect(() => {
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

      // Load user votes
      const votes: Record<string, string> = {};
      if (username) {
        data.bracket.rounds.forEach((round: any) => {
          round.duels.forEach((duel: any) => {
            const vote = getDuelVote(token, duel.id, username);
            if (vote) {
              votes[duel.id] = vote;
            }
          });
        });
      }
      setUserVotes(votes);
    };

    loadTournament();
  }, [token, username]);

  // Real-time polling every 2 seconds
  useEffect(() => {
    if (!tournament || tournament.bracket.status !== 'active') return;

    const interval = setInterval(() => {
      const data = getPollData(token, 'versus');
      if (data) {
        setTournament(data);

        // Update time remaining
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();
        setTimeRemaining(Math.max(0, expiresAt.getTime() - now.getTime()));

        // Check if tournament finished
        if (data.bracket.status === 'finished' || data.bracket.champion) {
          setShowCelebration(true);
        }

        // Update user votes
        if (username) {
          const votes: Record<string, string> = {};
          data.bracket.rounds.forEach((round: any) => {
            round.duels.forEach((duel: any) => {
              const vote = getDuelVote(token, duel.id, username);
              if (vote) {
                votes[duel.id] = vote;
              }
            });
          });
          setUserVotes(votes);
        }
      } else {
        // Tournament was deleted
        setNotFound(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [tournament, token, username]);

  // Countdown timer
  useEffect(() => {
    if (!tournament || tournament.bracket.status !== 'active') return;

    const interval = setInterval(() => {
      const expiresAt = new Date(tournament.expiresAt);
      const now = new Date();
      const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
      setTimeRemaining(remaining);

      // Check if expired
      if (remaining === 0 && tournament.bracket.status === 'active') {
        handleTournamentExpiration();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tournament]);

  const handleTournamentExpiration = () => {
    if (!tournament) return;

    // Handle expiration logic
    const updatedBracket = handleExpiration(tournament.bracket, tournament.votesToWin);
    const updatedTournament = {
      ...tournament,
      bracket: updatedBracket,
    };

    // Store updated tournament
    storePollData(token, updatedTournament, 'versus');
    setTournament(updatedTournament);

    // Show celebration
    if (updatedBracket.champion) {
      setShowCelebration(true);

      // Delete after 10 seconds
      setTimeout(() => {
        deleteTournamentData(token);
        setNotFound(true);
        setShowCelebration(false);
      }, 10000);
    }
  };

  const handleVote = (duelId: string, optionId: string) => {
    if (!tournament || !username) return;

    // Check if user already voted in this duel
    if (hasVotedInDuel(token, duelId, username)) return;

    // Record vote
    markDuelVote(token, duelId, username, optionId);

    // Update bracket with vote
    let updatedBracket = voteInDuel(tournament.bracket, duelId, username, optionId);
    let updatedTournament = { ...tournament, bracket: updatedBracket };

    // Check if duel is won
    const duel = updatedBracket.rounds[updatedBracket.currentRound].duels.find(d => d.id === duelId);
    if (duel && isDuelWon(duel, tournament.votesToWin)) {
      // Check if round is complete
      if (isRoundComplete(updatedBracket, tournament.votesToWin)) {
        // Advance to next round
        updatedBracket = advanceToNextRound(updatedBracket, tournament.votesToWin);
        updatedTournament = { ...tournament, bracket: updatedBracket };

        // Check if tournament is finished
        if (updatedBracket.status === 'finished' && updatedBracket.champion) {
          setShowCelebration(true);
        }
      }
    }

    // Store updated tournament
    storePollData(token, updatedTournament, 'versus');
    setTournament(updatedTournament);

    // Update user votes
    setUserVotes(prev => ({ ...prev, [duelId]: optionId }));
  };

  const getUserVote = (duelId: string): string | null => {
    return userVotes[duelId] || null;
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
    const isFinished = tournament.bracket.status === 'finished';

    if (isFinished || isTournamentExpired) {
      return {
        text: 'Terminada',
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⚔️</div>
          <p className="text-[var(--text-muted)]">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <ExpiredTournament />;
  }

  if (!tournament) return null;

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-[var(--primary)]" />
              <div>
                <h1 className="text-lg font-bold text-[var(--text)]">{tournament.title}</h1>
                <p className="text-xs text-[var(--text-muted)]">
                  by {tournament.createdBy} • {tournament.options.length} options • {tournament.votesToWin} votes to win
                </p>
              </div>
            </div>

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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <BracketView
          bracket={tournament.bracket}
          votesToWin={tournament.votesToWin}
          currentRound={tournament.bracket.currentRound}
          username={username}
          onVote={handleVote}
          getUserVote={getUserVote}
        />
      </div>

      {/* Celebration Screen */}
      {showCelebration && tournament.bracket.champion && (
        <CelebrationScreen
          champion={tournament.bracket.champion}
          tournamentTitle={tournament.title}
          onShareResult={() => {}}
        />
      )}
    </div>
  );
}
