'use client';

import { BracketMatch, Player } from '@/types/versus';
import { motion } from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MatchResultCard } from './MatchResultCard';
import { useLanguage } from '@/context/LanguageContext';

interface BracketResultViewProps {
  matches: BracketMatch[];
  hasScore: boolean;
  isEditable: boolean;
  onSaveResult: (matchId: string, result: any) => void;
  onAdvanceRound: (roundNumber: number) => void;
  currentRound: number;
  totalRounds: number;
  champion: Player | null;
}

export const BracketResultView = ({
  matches,
  hasScore,
  isEditable,
  onSaveResult,
  onAdvanceRound,
  currentRound,
  totalRounds,
  champion,
}: BracketResultViewProps) => {
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const [viewRound, setViewRound] = useState(currentRound);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setViewRound(currentRound);
  }, [currentRound]);

  const getRoundLabel = (roundNumber: number, totalRounds: number) => {
    if (roundNumber === totalRounds) return t('versus.bracketRoundFinal');
    if (roundNumber === totalRounds - 1) return t('versus.bracketRoundSemis');
    if (roundNumber === totalRounds - 2) return t('versus.bracketRoundQuarters');
    if (roundNumber === totalRounds - 3) return t('versus.bracketRoundEighths');
    return t('versus.bracketRoundN').replace('{n}', String(roundNumber));
  };

  const getRoundMatches = (roundNumber: number) => {
    return matches.filter(m => m.round === roundNumber);
  };

  const isRoundComplete = (roundNumber: number) => {
    const roundMatches = getRoundMatches(roundNumber);
    return roundMatches.every(m => m.status === 'completed');
  };

  const canAdvanceCurrentRound = isRoundComplete(currentRound) && currentRound < totalRounds;

  // Mobile stepper view
  if (isMobile) {
    const roundMatches = getRoundMatches(viewRound);
    const isFirstRound = viewRound === 1;
    const isLastRound = viewRound === totalRounds;

    return (
      <div className="w-full px-2 py-4">
        {/* Round navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewRound(Math.max(1, viewRound - 1))}
            disabled={isFirstRound}
            className={`p-2 rounded-lg transition-colors ${
              isFirstRound
                ? 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-[var(--text)]">
              {getRoundLabel(viewRound, totalRounds)}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {t('versus.roundXofY').replace('{n}', String(viewRound)).replace('{total}', String(totalRounds))}
            </p>
          </div>

          <button
            onClick={() => setViewRound(Math.min(totalRounds, viewRound + 1))}
            disabled={isLastRound}
            className={`p-2 rounded-lg transition-colors ${
              isLastRound
                ? 'bg-[var(--surface-2)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Champion display */}
        {champion && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl p-4 sm:p-6 shadow-2xl border-4 border-[var(--primary-light)] relative mb-4"
          >
            <motion.div
              className="absolute inset-0 bg-[var(--primary)] rounded-2xl blur-xl opacity-50"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative z-10 text-center">
              <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
              <p className="text-xs font-bold text-white/90 mb-1">{t('versus.championBadge')}</p>
              <p className="text-lg font-bold text-white">{champion.name}</p>
            </div>
          </motion.div>
        )}

        {/* Matches for current round */}
        <motion.div
          key={viewRound}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          {roundMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MatchResultCard
                match={match}
                hasScore={hasScore}
                isEditable={isEditable && match.round === currentRound}
                onSaveResult={onSaveResult}
                totalRounds={totalRounds}
                isBracket={true}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Advance round button */}
        {canAdvanceCurrentRound && isEditable && (
          <button
            onClick={() => onAdvanceRound(currentRound)}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            {t('versus.advanceRound')}
          </button>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
            <button
              key={round}
              onClick={() => setViewRound(round)}
              className={`w-2 h-2 rounded-full transition-all ${
                viewRound === round
                  ? 'bg-[var(--primary)] w-4'
                  : 'bg-[var(--border)] hover:bg-[var(--surface-2)]'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop bracket view: las rondas no-finales se splittean en izquierda
  // y derecha; la final va al centro.
  const leftSideRounds = Array.from({ length: totalRounds - 1 }, (_, i) => i + 1);
  const rightSideRounds = [...leftSideRounds].reverse();

  // Calculate dynamic column width based on total rounds
  const getColumnWidth = () => {
    if (totalRounds <= 2) return 'w-64 lg:w-72'; // 2-4 players: wider
    if (totalRounds <= 3) return 'w-52 lg:w-60'; // 5-8 players: medium
    return 'w-44 lg:w-52'; // 9+ players: default
  };

  // Calculate dynamic center width based on total rounds
  const getCenterWidth = () => {
    if (totalRounds <= 2) return 'w-80 lg:w-96'; // 2-4 players: wider
    if (totalRounds <= 3) return 'w-64 lg:w-72'; // 5-8 players: medium
    return 'w-48 lg:w-56'; // 9+ players: default
  };

  const columnWidth = getColumnWidth();
  const centerWidth = getCenterWidth();

  const getLeftHalfMatches = (roundNumber: number) => {
    const roundMatches = getRoundMatches(roundNumber);
    const mid = Math.ceil(roundMatches.length / 2);
    return roundMatches.slice(0, mid);
  };

  const getRightHalfMatches = (roundNumber: number) => {
    const roundMatches = getRoundMatches(roundNumber);
    const mid = Math.ceil(roundMatches.length / 2);
    return roundMatches.slice(mid);
  };

  return (
    // overflow-x-auto: si el bracket no entra (ej. 16 jugadores) hay scroll
    // horizontal. -mx-4/-mx-6/-mx-8 anula el padding del card padre así el
    // scroll arranca pegado al borde y no queda un hueco a los costados.
    <div className="overflow-x-auto -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pb-2">
      <div className="flex items-stretch justify-center gap-3 min-w-max py-4">
        {/* Left side of bracket */}
        <div className="flex gap-3">
          {leftSideRounds.map((roundNumber) => {
            const leftMatches = getLeftHalfMatches(roundNumber);

            return (
              <div key={`left-${roundNumber}`} className={`flex flex-col justify-around gap-3 ${columnWidth}`}>
                {/* Round Label */}
                <div className="text-center pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                    {getRoundLabel(roundNumber, totalRounds)}
                  </h3>
                </div>

                {/* Matches in this round (left half) */}
                <div className="flex flex-col justify-around gap-3 flex-1">
                  {leftMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MatchResultCard
                        match={match}
                        hasScore={hasScore}
                        isEditable={isEditable && match.round === currentRound}
                        onSaveResult={onSaveResult}
                        totalRounds={totalRounds}
                        isBracket={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center - Champion/Final */}
        <div className={`flex flex-col items-center justify-center px-2 ${centerWidth} flex-shrink-0`}>
          {champion ? (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl p-6 shadow-2xl border-4 border-[var(--primary-light)] relative w-full"
            >
              <motion.div
                className="absolute inset-0 bg-[var(--primary)] rounded-2xl blur-xl opacity-50"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative z-10">
                <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
                <div className="text-center">
                  <p className="text-xs font-bold text-white/90 mb-1">{t('versus.championBadge')}</p>
                  <p className="text-lg font-bold text-white break-words">{champion.name}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <h3 className="text-sm font-bold text-[var(--primary)] mb-3 uppercase tracking-wider">{t('versus.bracketRoundFinal')}</h3>
              {getRoundMatches(totalRounds).map((match) => (
                <div key={match.id} className="w-full">
                  <MatchResultCard
                    match={match}
                    hasScore={hasScore}
                    isEditable={isEditable && match.round === currentRound}
                    onSaveResult={onSaveResult}
                    totalRounds={totalRounds}
                    isBracket={true}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Advance round button (desktop) */}
          {canAdvanceCurrentRound && isEditable && (
            <button
              onClick={() => onAdvanceRound(currentRound)}
              className="mt-4 px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm w-full"
            >
              {t('versus.advanceRound')}
            </button>
          )}
        </div>

        {/* Right side of bracket */}
        <div className="flex gap-3">
          {rightSideRounds.map((roundNumber) => {
            const rightMatches = getRightHalfMatches(roundNumber);

            return (
              <div key={`right-${roundNumber}`} className={`flex flex-col justify-around gap-3 ${columnWidth}`}>
                {/* Round Label */}
                <div className="text-center pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] truncate">
                    {getRoundLabel(roundNumber, totalRounds)}
                  </h3>
                </div>

                {/* Matches in this round (right half) */}
                <div className="flex flex-col justify-around gap-3 flex-1">
                  {rightMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MatchResultCard
                        match={match}
                        hasScore={hasScore}
                        isEditable={isEditable && match.round === currentRound}
                        onSaveResult={onSaveResult}
                        totalRounds={totalRounds}
                        isBracket={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
