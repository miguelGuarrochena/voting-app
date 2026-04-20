'use client';

import { Bracket, Duel, VersusOption } from '@/types/versus';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface BracketViewProps {
  bracket: Bracket;
  votesToWin: number;
  currentRound: number;
  username: string | null;
  onVote: (duelId: string, option: VersusOption) => void;
  getUserVote: (duelId: string) => VersusOption | null;
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
  const leftSideRounds = bracket.rounds.slice(0, finalRoundIndex);
  const rightSideRounds = [...bracket.rounds.slice(0, finalRoundIndex)].reverse();

  return (
    <div className="flex items-center justify-center gap-4 min-w-max px-4 py-8">
      {/* Left side of bracket */}
      <div className="flex gap-4">
        {leftSideRounds.map((round, roundIndex) => {
          const leftDuels = getLeftHalfDuels(roundIndex);

          return (
            <div key={`left-${round.roundNumber}`} className="flex flex-col gap-3">
              {/* Round Label */}
              <div className="text-center pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {getSpanishRoundLabel(round.roundNumber, totalRounds)}
                </h3>
              </div>

              {/* Duels in this round (left half) */}
              <div className="flex flex-col gap-3">
                {leftDuels.map((duel, duelIndex) => {
                  const userSelection = getUserVote(duel.id);

                  return (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: duelIndex * 0.05 }}
                    >
                      <DuelSelectionCard
                        duel={duel}
                        username={username}
                        onVote={(option) => onVote(duel.id, option)}
                        userSelection={userSelection}
                      />
                    </motion.div>
                  );
                })}
              </div>
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
                <p className="text-xs font-bold text-yellow-100 mb-1">TU CAMPEÓN</p>
                <p className="text-lg font-bold text-white">{bracket.champion.title}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-3 uppercase tracking-wider">Final</h3>
            {bracket.rounds[finalRoundIndex] && bracket.rounds[finalRoundIndex].duels[0] && (
              <DuelSelectionCard
                duel={bracket.rounds[finalRoundIndex].duels[0]}
                username={username}
                onVote={(option) => onVote(bracket.rounds[finalRoundIndex].duels[0].id, option)}
                userSelection={getUserVote(bracket.rounds[finalRoundIndex].duels[0].id)}
              />
            )}
          </div>
        )}
      </div>

      {/* Right side of bracket */}
      <div className="flex gap-4">
        {rightSideRounds.map((round, reversedIndex) => {
          const roundIndex = finalRoundIndex - 1 - reversedIndex;
          const rightDuels = getRightHalfDuels(roundIndex);

          return (
            <div key={`right-${round.roundNumber}`} className="flex flex-col gap-3">
              {/* Round Label */}
              <div className="text-center pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {getSpanishRoundLabel(round.roundNumber, totalRounds)}
                </h3>
              </div>

              {/* Duels in this round (right half) */}
              <div className="flex flex-col gap-3">
                {rightDuels.map((duel, duelIndex) => {
                  const userSelection = getUserVote(duel.id);

                  return (
                    <motion.div
                      key={duel.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: duelIndex * 0.05 }}
                    >
                      <DuelSelectionCard
                        duel={duel}
                        username={username}
                        onVote={(option) => onVote(duel.id, option)}
                        userSelection={userSelection}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple duel selection card
interface DuelSelectionCardProps {
  duel: Duel;
  username: string | null;
  onVote: (option: VersusOption) => void;
  userSelection: VersusOption | null;
}

const DuelSelectionCard = ({ duel, username, onVote, userSelection }: DuelSelectionCardProps) => {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 min-w-[140px]">
      <div className="space-y-2">
        <button
          onClick={() => onVote(duel.optionA)}
          className={`w-full text-left p-2 rounded transition-all ${
            userSelection?.id === duel.optionA.id
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-2)] hover:bg-[var(--surface)]'
          }`}
        >
          <span className="text-sm font-medium">{duel.optionA.title}</span>
        </button>
        <button
          onClick={() => onVote(duel.optionB)}
          className={`w-full text-left p-2 rounded transition-all ${
            userSelection?.id === duel.optionB.id
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-2)] hover:bg-[var(--surface)]'
          }`}
        >
          <span className="text-sm font-medium">{duel.optionB.title}</span>
        </button>
      </div>
    </div>
  );
};
