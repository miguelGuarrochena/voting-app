'use client';

import { Match, MatchResult, ScoreResult, WinLossResult } from '@/types/versus';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface MatchResultCardProps {
  match: Match;
  hasScore: boolean;
  isEditable: boolean;
  onSaveResult: (matchId: string, result: MatchResult) => void;
  totalRounds?: number;
  isBracket?: boolean;
}

export const MatchResultCard = ({ match, hasScore, isEditable, onSaveResult, totalRounds, isBracket }: MatchResultCardProps) => {
  const { t } = useLanguage();
  const [scoreA, setScoreA] = useState(match.result?.type === 'score' ? match.result.scoreA : 0);
  const [scoreB, setScoreB] = useState(match.result?.type === 'score' ? match.result.scoreB : 0);
  const [winner, setWinner] = useState<WinLossResult['winner'] | null>(
    match.result?.type === 'winloss' ? match.result.winner : null
  );

  const isCompleted = match.status === 'completed';

  // Calculate dynamic minWidth based on total rounds (more rounds = more players = narrower buttons)
  const getMinWidth = () => {
    if (!totalRounds) return 'min-w-0';
    if (totalRounds <= 2) return 'min-w-[100px]'; // 2-4 players: wider
    if (totalRounds <= 3) return 'min-w-[80px]'; // 5-8 players: medium
    return 'min-w-[60px]'; // 9+ players: narrower
  };

  const buttonMinWidth = getMinWidth();

  const handleScoreSubmit = () => {
    if (scoreA < 0 || scoreB < 0) return;
    const result: ScoreResult = { type: 'score', scoreA, scoreB };
    onSaveResult(match.id, result);
  };

  const handleWinnerSelect = (selectedWinner: 'A' | 'B' | 'draw') => {
    const result: WinLossResult = { type: 'winloss', winner: selectedWinner };
    onSaveResult(match.id, result);
  };

  // Truncate player name for button text to prevent overflow
  const truncateName = (name: string, maxLength: number = 10) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Display mode
  if (!isEditable || isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-[var(--surface-2)] border rounded-lg p-3 sm:p-4 ${
          isCompleted ? 'border-[var(--primary)] bg-[var(--primary-light)]/10' : 'border-[var(--border)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Player A */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text)] truncate">{match.playerA.name}</p>
          </div>

          {/* Result */}
          <div className="flex items-center gap-2">
            {isCompleted && match.result ? (
              <div className="text-center">
                {match.result.type === 'score' ? (
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {match.result.scoreA} - {match.result.scoreB}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-[var(--primary)]">
                    {match.result.winner === 'A' && t('versus.playerWins').replace('{name}', match.playerA.name)}
                    {match.result.winner === 'B' && t('versus.playerWins').replace('{name}', match.playerB.name)}
                    {match.result.winner === 'draw' && t('versus.drawLabel')}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">vs</span>
            )}
          </div>

          {/* Player B */}
          <div className="flex-1 min-w-0 text-right">
            <p className="font-medium text-[var(--text)] truncate">{match.playerB.name}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Edit mode - with score
  if (hasScore) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 sm:p-4"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Player A */}
          <div className="flex items-center gap-2 flex-1">
            <p className="font-medium text-[var(--text)] truncate">{match.playerA.name}</p>
            <input
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--text-muted)]">vs</span>
          </div>

          {/* Player B */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <input
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="font-medium text-[var(--text)] truncate">{match.playerB.name}</p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleScoreSubmit}
          className="w-full mt-3 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors"
        >
          {t('versus.saveResult')}
        </button>
      </motion.div>
    );
  }

  // Edit mode - without score (win/loss/draw)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 sm:p-4"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Player A - clickable to select as winner */}
        <button
          onClick={() => handleWinnerSelect('A')}
          className={`flex-1 ${buttonMinWidth} text-center p-3 rounded-lg cursor-pointer transition-all ${
            winner === 'A'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md'
          }`}
        >
          <p className="font-medium truncate">{match.playerA.name}</p>
        </button>

        {/* VS */}
        <span className="text-sm font-bold text-[var(--text-muted)]">vs</span>

        {/* Player B - clickable to select as winner */}
        <button
          onClick={() => handleWinnerSelect('B')}
          className={`flex-1 ${buttonMinWidth} text-center p-3 rounded-lg cursor-pointer transition-all ${
            winner === 'B'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md'
          }`}
        >
          <p className="font-medium truncate">{match.playerB.name}</p>
        </button>
      </div>

      {/* Draw button only - not shown in brackets */}
      {!isBracket && (
        <button
          onClick={() => handleWinnerSelect('draw')}
          className={`w-full px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all ${
            winner === 'draw'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md'
          }`}
        >
          {t('versus.drawLabel')}
        </button>
      )}
    </motion.div>
  );
};
