'use client';

import { Duel } from '@/types/versus';
import { motion } from 'framer-motion';

interface DuelCardProps {
  duel: Duel;
  votesToWin: number;
  isActive: boolean;
  username: string | null;
  onVote: (optionId: string) => void;
  userVote: string | null;
}

export const DuelCard = ({ duel, votesToWin, isActive, username, onVote, userVote }: DuelCardProps) => {
  const progressA = (duel.votesA / votesToWin) * 100;
  const progressB = (duel.votesB / votesToWin) * 100;
  const hasVoted = userVote !== null;
  const winner = duel.winner;
  const isAWinner = winner?.id === duel.optionA.id;
  const isBWinner = winner?.id === duel.optionB.id;

  return (
    <div
      className={`bg-[var(--surface)] rounded-xl border-2 transition-all ${
        isActive
          ? 'border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20'
          : 'border-[var(--border)] opacity-60'
      } ${winner ? 'border-green-500/50' : ''}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {isActive && '⚔️ Active Duel'}
            {!isActive && !winner && 'Upcoming'}
            {winner && '🏆 Completed'}
          </span>
          {duel.isRandomWinner && winner && (
            <span className="text-xs">🎲</span>
          )}
        </div>

        {/* Option A */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${isAWinner ? 'text-green-600 dark:text-green-400' : 'text-[var(--text)]'} ${winner && !isAWinner ? 'line-through opacity-50' : ''}`}>
              {duel.optionA.title}
            </span>
            <span className="text-sm font-bold text-[var(--primary)]">{duel.votesA}</span>
          </div>
          <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressA, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* VS */}
        <div className="text-center text-xs font-bold text-[var(--text-muted)] my-2">VS</div>

        {/* Option B */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${isBWinner ? 'text-green-600 dark:text-green-400' : 'text-[var(--text)]'} ${winner && !isBWinner ? 'line-through opacity-50' : ''}`}>
              {duel.optionB.title}
            </span>
            <span className="text-sm font-bold text-[var(--primary)]">{duel.votesB}</span>
          </div>
          <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressB, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Votes to win indicator */}
        <div className="text-center text-xs text-[var(--text-muted)] mb-3">
          {votesToWin} votes to win
        </div>

        {/* Vote buttons or result */}
        {isActive && !hasVoted && username ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onVote(duel.optionA.id)}
              disabled={!!winner}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              Vote {duel.optionA.title}
            </button>
            <button
              onClick={() => onVote(duel.optionB.id)}
              disabled={!!winner}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
            >
              Vote {duel.optionB.title}
            </button>
          </div>
        ) : hasVoted ? (
          <div className="text-center text-sm text-[var(--text-muted)]">
            You voted for {userVote === duel.optionA.id ? duel.optionA.title : duel.optionB.title}
          </div>
        ) : !username ? (
          <div className="text-center text-sm text-[var(--text-muted)]">
            Set your username to vote
          </div>
        ) : winner ? (
          <div className="text-center text-sm font-medium text-green-600 dark:text-green-400">
            🏆 {winner.title} wins!
          </div>
        ) : null}
      </div>
    </div>
  );
};
