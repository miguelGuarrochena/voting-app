'use client';

import { Bracket, Duel, VersusOption } from '@/types/versus';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BracketViewProps {
  bracket: Bracket;
  votesToWin: number;
  currentRound: number;
  username: string | null;
  onVote: (duelId: string, option: VersusOption) => void;
  getUserVote: (duelId: string) => VersusOption | null;
}

export const BracketView = ({ bracket, votesToWin, currentRound, username, onVote, getUserVote }: BracketViewProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Mobile stepper view
  if (isMobile) {
    const currentRound = bracket.rounds[currentRoundIndex];
    const isLastRound = currentRoundIndex === bracket.rounds.length - 1;
    const isFirstRound = currentRoundIndex === 0;

    return (
      <div className="w-full px-2 py-4">
        {/* Round navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentRoundIndex(Math.max(0, currentRoundIndex - 1))}
            disabled={isFirstRound}
            className={`p-2 rounded-lg transition-colors ${
              isFirstRound
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">
              {getSpanishRoundLabel(currentRound.roundNumber, totalRounds)}
            </h2>
            <p className="text-sm text-gray-500">
              Ronda {currentRoundIndex + 1} de {totalRounds}
            </p>
          </div>

          <button
            onClick={() => setCurrentRoundIndex(Math.min(bracket.rounds.length - 1, currentRoundIndex + 1))}
            disabled={isLastRound}
            className={`p-2 rounded-lg transition-colors ${
              isLastRound
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Champion display */}
        {bracket.champion && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-6 shadow-2xl border-4 border-blue-400 relative mb-4"
          >
            <motion.div
              className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-50"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative z-10 text-center">
              <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
              <p className="text-xs font-bold text-white/90 mb-1">TU CAMPEÓN</p>
              <p className="text-lg font-bold text-white">{bracket.champion.title}</p>
            </div>
          </motion.div>
        )}

        {/* Duels for current round */}
        <motion.div
          key={currentRoundIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {currentRound.duels.map((duel, duelIndex) => {
            const userSelection = getUserVote(duel.id);
            return (
              <motion.div
                key={duel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: duelIndex * 0.1 }}
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
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {bracket.rounds.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentRoundIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentRoundIndex
                  ? 'bg-blue-500 w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop bracket view
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
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
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border-4 border-blue-400 relative"
          >
            <motion.div
              className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-50"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative z-10">
              <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
              <div className="text-center">
                <p className="text-xs font-bold text-white/90 mb-1">TU CAMPEÓN</p>
                <p className="text-lg font-bold text-white">{bracket.champion.title}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-bold text-blue-600 mb-3 uppercase tracking-wider">Final</h3>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
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
  // Disable both buttons if either option is a placeholder
  const isDuelDisabled = !duel.optionA.id || duel.optionA.title === '???' || !duel.optionB.id || duel.optionB.title === '???';

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 sm:p-3">
      <div className="space-y-2">
        <button
          onClick={() => !isDuelDisabled && onVote(duel.optionA)}
          disabled={isDuelDisabled}
          className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all ${
            userSelection?.id === duel.optionA.id
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
              : isDuelDisabled
              ? 'bg-gray-200 opacity-50 cursor-not-allowed text-gray-400'
              : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm hover:shadow'
          }`}
        >
          <span className="text-sm font-medium">{duel.optionA.title}</span>
        </button>
        <button
          onClick={() => !isDuelDisabled && onVote(duel.optionB)}
          disabled={isDuelDisabled}
          className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all ${
            userSelection?.id === duel.optionB.id
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
              : isDuelDisabled
              ? 'bg-gray-200 opacity-50 cursor-not-allowed text-gray-400'
              : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm hover:shadow'
          }`}
        >
          <span className="text-sm font-medium">{duel.optionB.title}</span>
        </button>
      </div>
    </div>
  );
};
