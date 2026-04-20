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
  const votedForA = userVote === duel.optionA.id;
  const votedForB = userVote === duel.optionB.id;

  return (
    <div
      className={`bg-[var(--surface)] rounded-lg border-2 transition-all ${
        isActive
          ? 'border-pink-500 shadow-lg shadow-pink-500/20'
          : winner
          ? 'border-green-500/30'
          : 'border-dashed border-[var(--border)] opacity-60'
      }`}
    >
      <div className="p-3">
        {/* Option A */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-bold text-sm ${isAWinner ? 'text-green-600 dark:text-green-400' : 'text-[var(--text)]'} ${winner && !isAWinner ? 'line-through opacity-50 text-gray-400' : ''}`}>
              {duel.optionA.title}
            </span>
            <div className="flex items-center gap-2">
              {votedForA && <span className="text-green-500 font-bold text-xs">✓</span>}
              <span className="text-xs font-bold text-[var(--primary)]">{duel.votesA}</span>
              {isActive && !hasVoted && username && !winner && (
                <button
                  onClick={() => onVote(duel.optionA.id)}
                  className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
                >
                  Votar
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressA, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* VS */}
        <div className="text-center text-xs font-bold text-[var(--text-muted)] my-1">VS</div>

        {/* Option B */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-bold text-sm ${isBWinner ? 'text-green-600 dark:text-green-400' : 'text-[var(--text)]'} ${winner && !isBWinner ? 'line-through opacity-50 text-gray-400' : ''}`}>
              {duel.optionB.title}
            </span>
            <div className="flex items-center gap-2">
              {votedForB && <span className="text-green-500 font-bold text-xs">✓</span>}
              <span className="text-xs font-bold text-[var(--primary)]">{duel.votesB}</span>
              {isActive && !hasVoted && username && !winner && (
                <button
                  onClick={() => onVote(duel.optionB.id)}
                  className="px-2 py-0.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
                >
                  Votar
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressB, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Status message */}
        {hasVoted ? (
          <div className="text-center text-xs text-[var(--text-muted)] mt-2">
            Votaste por {userVote === duel.optionA.id ? duel.optionA.title : duel.optionB.title}
          </div>
        ) : !username ? (
          <div className="text-center text-xs text-[var(--text-muted)] mt-2">
            Configura tu nombre para votar
          </div>
        ) : winner ? (
          <div className="text-center text-xs font-medium text-green-600 dark:text-green-400 mt-2">
            🏆 {winner.title} gana
          </div>
        ) : !isActive ? (
          <div className="text-center text-xs text-[var(--text-muted)] mt-2">
            {duel.optionA.title === '???' ? '???' : 'Próximo'}
          </div>
        ) : null}
      </div>
    </div>
  );
};
