'use client';

import { Bracket, Duel } from '@/types/versus';
import { DuelCard } from './DuelCard';
import { motion } from 'framer-motion';

interface BracketViewProps {
  bracket: Bracket;
  votesToWin: number;
  currentRound: number;
  username: string | null;
  onVote: (duelId: string, optionId: string) => void;
  getUserVote: (duelId: string) => string | null;
}

export const BracketView = ({ bracket, votesToWin, currentRound, username, onVote, getUserVote }: BracketViewProps) => {
  const getRoundLabel = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return 'Final';
    if (roundNumber === totalRounds - 1) return 'Semifinals';
    if (roundNumber === totalRounds - 2) return 'Quarterfinals';
    return `Round ${roundNumber}`;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {bracket.rounds.map((round, roundIndex) => {
          const isCurrentRound = roundIndex === currentRound;
          const isFutureRound = roundIndex > currentRound;
          const isPastRound = roundIndex < currentRound;

          return (
            <div key={round.roundNumber} className="flex flex-col gap-4">
              {/* Round Label */}
              <div className="text-center">
                <h3 className={`text-sm font-bold ${
                  isCurrentRound ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {getRoundLabel(round.roundNumber, bracket.rounds.length)}
                </h3>
                {isCurrentRound && (
                  <motion.div
                    className="w-16 h-1 bg-[var(--primary)] mx-auto mt-1 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Duels in this round */}
              <div className="flex flex-col gap-4">
                {round.duels.map((duel, duelIndex) => {
                  const isActive = isCurrentRound && !duel.winner;
                  const userVote = getUserVote(duel.id);

                  return (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: duelIndex * 0.1 }}
                    >
                      <DuelCard
                        duel={duel}
                        votesToWin={votesToWin}
                        isActive={isActive}
                        username={username}
                        onVote={(optionId) => onVote(duel.id, optionId)}
                        userVote={userVote}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Connector line (except for last round) */}
              {roundIndex < bracket.rounds.length - 1 && (
                <div className="flex justify-center">
                  <div className={`w-0.5 h-8 ${
                    isPastRound ? 'bg-green-500' : 'bg-[var(--border)]'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
