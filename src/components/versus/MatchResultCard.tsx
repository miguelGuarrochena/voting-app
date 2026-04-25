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
}

export const MatchResultCard = ({ match, hasScore, isEditable, onSaveResult }: MatchResultCardProps) => {
  const { t } = useLanguage();
  const [scoreA, setScoreA] = useState(match.result?.type === 'score' ? match.result.scoreA : 0);
  const [scoreB, setScoreB] = useState(match.result?.type === 'score' ? match.result.scoreB : 0);
  const [winner, setWinner] = useState<WinLossResult['winner'] | null>(
    match.result?.type === 'winloss' ? match.result.winner : null
  );

  const isCompleted = match.status === 'completed';

  const handleScoreSubmit = () => {
    if (scoreA < 0 || scoreB < 0) return;
    const result: ScoreResult = { type: 'score', scoreA, scoreB };
    onSaveResult(match.id, result);
  };

  const handleWinnerSelect = (selectedWinner: 'A' | 'B' | 'draw') => {
    const result: WinLossResult = { type: 'winloss', winner: selectedWinner };
    onSaveResult(match.id, result);
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
        <div className="flex items-center justify-between gap-3">
          {/* Player A */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text)] truncate mb-2">{match.playerA.name}</p>
            <input
              type="number"
              min="0"
              value={scoreA}
              onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--text-muted)]">vs</span>
          </div>

          {/* Player B */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--text)] truncate mb-2 text-right">{match.playerB.name}</p>
            <input
              type="number"
              min="0"
              value={scoreB}
              onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
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
        {/* Player A */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--text)] truncate">{match.playerA.name}</p>
        </div>

        {/* VS */}
        <span className="text-sm font-bold text-[var(--text-muted)]">vs</span>

        {/* Player B */}
        <div className="flex-1 min-w-0 text-right">
          <p className="font-medium text-[var(--text)] truncate">{match.playerB.name}</p>
        </div>
      </div>

      {/* Winner buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleWinnerSelect('A')}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            winner === 'A'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]'
          }`}
        >
          {t('versus.playerWins').replace('{name}', match.playerA.name)}
        </button>
        <button
          onClick={() => handleWinnerSelect('draw')}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            winner === 'draw'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]'
          }`}
        >
          {t('versus.drawLabel')}
        </button>
        <button
          onClick={() => handleWinnerSelect('B')}
          className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            winner === 'B'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]'
          }`}
        >
          {t('versus.playerWins').replace('{name}', match.playerB.name)}
        </button>
      </div>
    </motion.div>
  );
};
