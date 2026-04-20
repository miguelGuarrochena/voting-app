'use client';

import { Bracket, Duel } from '@/types/versus';
import { DuelCard } from './DuelCard';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface BracketViewProps {
  bracket: Bracket;
  votesToWin: number;
  currentRound: number;
  username: string | null;
  onVote: (duelId: string, optionId: string) => void;
  getUserVote: (duelId: string) => string | null;
}

export const BracketView = ({ bracket, votesToWin, currentRound, username, onVote, getUserVote }: BracketViewProps) => {
  const getSpanishRoundLabel = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return 'Final';
    if (roundNumber === totalRounds - 1) return 'Semifinales';
    if (roundNumber === totalRounds - 2) return 'Cuartos';
    if (roundNumber === totalRounds - 3) return 'Octavos';
    return `Ronda ${roundNumber}`;
  };

  const totalRounds = bracket.rounds.length;
  const finalRoundIndex = totalRounds - 1;

  // Split each round into left and right halves
  const getLeftHalfDuels = (roundIndex: number) => {
    const round = bracket.rounds[roundIndex];
    if (!round) return [];
    const mid = Math.ceil(round.duels.length / 2);
    return round.duels.slice(0, mid);
  };

  const getRightHalfDuels = (roundIndex: number) => {
    const round = bracket.rounds[roundIndex];
    if (!round) return [];
    const mid = Math.ceil(round.duels.length / 2);
    return round.duels.slice(mid);
  };

  // Build the bracket columns from left to right
  // Left side: rounds 0 to finalRoundIndex-1 (in order)
  // Center: final/champion
  // Right side: rounds finalRoundIndex-1 to 0 (in reverse order)
  const leftSideRounds = bracket.rounds.slice(0, finalRoundIndex);
  const rightSideRounds = [...bracket.rounds.slice(0, finalRoundIndex)].reverse();

  return (
    <div className="flex items-center justify-center gap-4 min-w-max px-4 py-8">
      {/* Left side of bracket - rounds flow toward center */}
      <div className="flex gap-4">
        {leftSideRounds.map((round, roundIndex) => {
          const isCurrentRound = roundIndex === currentRound;
          const isPastRound = roundIndex < currentRound;
          const leftDuels = getLeftHalfDuels(roundIndex);

          return (
            <div key={`left-${round.roundNumber}`} className="flex flex-col gap-3">
              {/* Round Label */}
              <div className="text-center pb-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  isCurrentRound ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {getSpanishRoundLabel(round.roundNumber, totalRounds)}
                </h3>
                {isCurrentRound && (
                  <motion.div
                    className="w-12 h-0.5 bg-[var(--primary)] mx-auto mt-1 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Duels in this round (left half) */}
              <div className="flex flex-col gap-3">
                {leftDuels.map((duel, duelIndex) => {
                  const isActive = isCurrentRound && !duel.winner;
                  const userVote = getUserVote(duel.id);

                  return (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: duelIndex * 0.05 }}
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

              {/* Connector line to next round */}
              {roundIndex < leftSideRounds.length - 1 && (
                <div className="flex justify-center">
                  <div className={`w-6 h-0.5 ${
                    isPastRound ? 'bg-pink-500' : 'border-t-2 border-dashed border-[var(--border)]'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Center - Champion/Final */}
      <div className="flex flex-col items-center justify-center px-4">
        {bracket.champion ? (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-6 shadow-2xl border-4 border-yellow-300 relative"
          >
            <motion.div
              className="absolute inset-0 bg-yellow-400 rounded-2xl blur-xl opacity-50"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative z-10">
              <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
              <div className="text-center">
                <p className="text-xs font-bold text-yellow-100 mb-1">CAMPEÓN</p>
                <p className="text-lg font-bold text-white">{bracket.champion.title}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-3 uppercase tracking-wider">Final</h3>
            {bracket.rounds[finalRoundIndex] && bracket.rounds[finalRoundIndex].duels[0] && (
              <DuelCard
                duel={bracket.rounds[finalRoundIndex].duels[0]}
                votesToWin={votesToWin}
                isActive={currentRound === finalRoundIndex && !bracket.rounds[finalRoundIndex].duels[0].winner}
                username={username}
                onVote={(optionId) => onVote(bracket.rounds[finalRoundIndex].duels[0].id, optionId)}
                userVote={getUserVote(bracket.rounds[finalRoundIndex].duels[0].id)}
              />
            )}
          </div>
        )}
      </div>

      {/* Right side of bracket - rounds flow from center outward (reversed) */}
      <div className="flex gap-4">
        {rightSideRounds.map((round, reversedIndex) => {
          const roundIndex = finalRoundIndex - 1 - reversedIndex;
          const isCurrentRound = roundIndex === currentRound;
          const isPastRound = roundIndex < currentRound;
          const rightDuels = getRightHalfDuels(roundIndex);

          return (
            <div key={`right-${round.roundNumber}`} className="flex flex-col gap-3">
              {/* Round Label */}
              <div className="text-center pb-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${
                  isCurrentRound ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {getSpanishRoundLabel(round.roundNumber, totalRounds)}
                </h3>
                {isCurrentRound && (
                  <motion.div
                    className="w-12 h-0.5 bg-[var(--primary)] mx-auto mt-1 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Duels in this round (right half) */}
              <div className="flex flex-col gap-3">
                {rightDuels.map((duel, duelIndex) => {
                  const isActive = isCurrentRound && !duel.winner;
                  const userVote = getUserVote(duel.id);

                  return (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: duelIndex * 0.05 }}
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

              {/* Connector line to next round */}
              {reversedIndex < rightSideRounds.length - 1 && (
                <div className="flex justify-center">
                  <div className={`w-6 h-0.5 ${
                    isPastRound ? 'bg-pink-500' : 'border-t-2 border-dashed border-[var(--border)]'
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
