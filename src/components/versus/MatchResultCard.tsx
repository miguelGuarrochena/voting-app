'use client';

import { Match, MatchResult, ScoreResult, WinLossResult } from '@/types/versus';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import toast from 'react-hot-toast';

interface MatchResultCardProps {
  match: Match;
  hasScore: boolean;
  isEditable: boolean;
  onSaveResult: (matchId: string, result: MatchResult) => void;
  totalRounds?: number;
  isBracket?: boolean;
  /**
   * Layout vertical/apilado: nombre arriba, scores en el medio, nombre
   * abajo. Lo usamos en el bracket de desktop para que los nombres entren
   * completos (sin truncate) y todos los cards queden del mismo tamaño.
   */
  stacked?: boolean;
}

export const MatchResultCard = ({ match, hasScore, isEditable, onSaveResult, totalRounds, isBracket, stacked }: MatchResultCardProps) => {
  const { t } = useLanguage();
  const [scoreA, setScoreA] = useState<string>('');
  const [scoreB, setScoreB] = useState<string>('');
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
    const numScoreA = parseInt(scoreA, 10);
    const numScoreB = parseInt(scoreB, 10);
    const safeA = Number.isFinite(numScoreA) ? numScoreA : 0;
    const safeB = Number.isFinite(numScoreB) ? numScoreB : 0;
    if (safeA < 0 || safeB < 0) return;
    if (isBracket && safeA === safeB) {
      toast.error(t('versus.noDraw'));
      return;
    }
    const result: ScoreResult = { type: 'score', scoreA: safeA, scoreB: safeB };
    onSaveResult(match.id, result);
  };

  // Solo permitir dígitos. Usamos type="text" + inputMode numérico para que
  // funcione bien en mobile (teclado numérico) y permita borrar/escribir a
  // mano sin las quirks de type="number" (rueda del mouse, leading zeros, etc.)
  const handleScoreChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip non-digits
    const digits = raw.replace(/\D/g, '');
    setter(digits);
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

  // ─────────────────────────────────────────────────────────────────
  //  STACKED variants (desktop bracket): cada equipo en su propia fila
  //  con su input/score al lado. Layout clásico de tabla de torneos —
  //  no hay ambigüedad sobre a qué equipo corresponde cada resultado.
  //
  //  Equipo A     [score A]
  //  Equipo B     [score B]
  //  [Save Result]
  // ─────────────────────────────────────────────────────────────────

  // Stacked display mode (completed o pending)
  if ((!isEditable || isCompleted) && stacked) {
    const winnerSide: 'A' | 'B' | 'draw' | null =
      isCompleted && match.result
        ? match.result.type === 'score'
          ? match.result.scoreA > match.result.scoreB
            ? 'A'
            : match.result.scoreB > match.result.scoreA
            ? 'B'
            : 'draw'
          : match.result.winner
        : null;

    const rowClass = (side: 'A' | 'B') =>
      `flex items-center justify-between gap-2 px-2 py-1.5 rounded ${
        winnerSide === side
          ? 'bg-[var(--primary-light)]/30 font-semibold text-[var(--text)]'
          : 'text-[var(--text)]'
      }`;

    const scoreFor = (side: 'A' | 'B') => {
      if (!isCompleted || !match.result) return null;
      if (match.result.type === 'score') {
        return side === 'A' ? match.result.scoreA : match.result.scoreB;
      }
      // winloss: marcamos ✓ al ganador, — al perdedor, = al empate
      if (match.result.winner === 'draw') return '=';
      return match.result.winner === side ? '✓' : '—';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-[var(--surface-2)] border rounded-lg p-2 ${
          isCompleted ? 'border-[var(--primary)] bg-[var(--primary-light)]/10' : 'border-[var(--border)]'
        }`}
      >
        <div className={rowClass('A')}>
          <p className="font-medium text-sm break-words leading-tight flex-1 min-w-0">
            {match.playerA.name}
          </p>
          {isCompleted ? (
            <span className="text-base font-bold text-[var(--primary)] flex-shrink-0 w-6 text-center">
              {scoreFor('A')}
            </span>
          ) : null}
        </div>
        <div className={rowClass('B')}>
          <p className="font-medium text-sm break-words leading-tight flex-1 min-w-0">
            {match.playerB.name}
          </p>
          {isCompleted ? (
            <span className="text-base font-bold text-[var(--primary)] flex-shrink-0 w-6 text-center">
              {scoreFor('B')}
            </span>
          ) : null}
        </div>
      </motion.div>
    );
  }

  // Stacked edit mode - with score: input al lado de cada equipo.
  if (hasScore && stacked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2"
      >
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-1">
          <p className="font-medium text-sm break-words leading-tight flex-1 min-w-0 text-[var(--text)]">
            {match.playerA.name}
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={scoreA}
            onChange={handleScoreChange(setScoreA)}
            placeholder="0"
            aria-label={t('versus.scoreInputAriaLabel').replace('{name}', match.playerA.name)}
            className="w-12 flex-shrink-0 px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 mb-2">
          <p className="font-medium text-sm break-words leading-tight flex-1 min-w-0 text-[var(--text)]">
            {match.playerB.name}
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={scoreB}
            onChange={handleScoreChange(setScoreB)}
            placeholder="0"
            aria-label={t('versus.scoreInputAriaLabel').replace('{name}', match.playerB.name)}
            className="w-12 flex-shrink-0 px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <button
          onClick={handleScoreSubmit}
          className="w-full px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg font-medium text-xs hover:bg-[var(--primary-dark)] transition-colors"
        >
          {t('versus.saveResult')}
        </button>
      </motion.div>
    );
  }

  // Stacked edit mode - sin score (win/loss): cada fila es un botón
  // clickeable que marca al ganador. En bracket no hay empate.
  if (stacked) {
    const rowBtn = (side: 'A' | 'B', name: string) => (
      <button
        onClick={() => handleWinnerSelect(side)}
        className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-all ${
          winner === side
            ? 'bg-[var(--primary)] text-white shadow-md'
            : 'bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-md'
        }`}
      >
        <p className="font-medium text-sm break-words leading-tight">{name}</p>
      </button>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 space-y-1.5"
      >
        {rowBtn('A', match.playerA.name)}
        {rowBtn('B', match.playerB.name)}
        {!isBracket && (
          <button
            onClick={() => handleWinnerSelect('draw')}
            className={`w-full px-3 py-1.5 rounded-lg font-medium text-xs cursor-pointer transition-all ${
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
  }

  // ─────────────────────────────────────────────────────────────────
  //  HORIZONTAL variants (mobile bracket + league): layout original
  // ─────────────────────────────────────────────────────────────────

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
              <span className="text-xs text-[var(--text-muted)]">{t('versus.vsAbbrev')}</span>
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
        {/* min-w-0 en cada flex item es lo que permite que truncate funcione
            dentro de un flex parent. Sin esto, el contenido empuja el card
            hasta hacerlo overflow en mobile (ej. "Bayer Munich" se cortaba). */}
        <div className="flex items-center justify-center gap-2 min-w-0">
          {/* Player A */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
            <p className="font-medium text-[var(--text)] truncate min-w-0 text-right">{match.playerA.name}</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={scoreA}
              onChange={handleScoreChange(setScoreA)}
              placeholder="0"
              className="w-10 sm:w-12 sm:w-16 flex-shrink-0 px-1 sm:px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* VS */}
          <div className="flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[var(--text-muted)]">{t('versus.vsAbbrev')}</span>
          </div>

          {/* Player B */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={scoreB}
              onChange={handleScoreChange(setScoreB)}
              placeholder="0"
              className="w-10 sm:w-12 sm:w-16 flex-shrink-0 px-1 sm:px-2 py-1 border border-[var(--border)] rounded bg-[var(--surface-2)] text-[var(--text)] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <p className="font-medium text-[var(--text)] truncate min-w-0">{match.playerB.name}</p>
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
        <span className="text-sm font-bold text-[var(--text-muted)]">{t('versus.vsAbbrev')}</span>

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
