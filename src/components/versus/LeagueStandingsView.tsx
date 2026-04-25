'use client';

import { useState, useRef } from 'react';
import { LeagueMatch, LeagueStanding, Player } from '@/types/versus';
import { motion } from 'framer-motion';
import { MatchResultCard } from './MatchResultCard';
import { useLanguage } from '@/context/LanguageContext';
import { GripVertical } from 'lucide-react';

interface LeagueStandingsViewProps {
  matches: LeagueMatch[];
  standings: LeagueStanding[];
  hasScore: boolean;
  isEditable: boolean;
  onSaveResult: (matchId: string, result: any) => void;
  champion: Player | null;
}

export const LeagueStandingsView = ({
  matches,
  standings,
  hasScore,
  isEditable,
  onSaveResult,
  champion,
}: LeagueStandingsViewProps) => {
  const { t } = useLanguage();

  // Visual order state (purely for display, doesn't affect results)
  const [visualOrder, setVisualOrder] = useState<string[]>(matches.map(m => m.id));

  // Drag-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Update visual order when matches change (e.g., after reordering)
  const getMatchesInVisualOrder = () => {
    const matchMap = new Map(matches.map(m => [m.id, m]));
    return visualOrder.map(id => matchMap.get(id)).filter((m): m is LeagueMatch => m !== undefined);
  };

  const completedMatches = getMatchesInVisualOrder().filter(m => m.status === 'completed');
  const pendingMatches = getMatchesInVisualOrder().filter(m => m.status === 'pending');
  const isFinished = champion !== null;

  // Reorder matches visually
  const reorderMatches = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setVisualOrder((current) => {
      if (from >= current.length || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // Drag handlers
  const onDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch {}
  };
  const onDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };
  const onDragLeave = () => setDragOverIndex(null);
  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    setDragOverIndex(null);
    dragIndexRef.current = null;
    if (from === null) return;
    reorderMatches(from, index);
  };
  const onDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Standings Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text)]">{t('versus.standings')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('versus.playerColumn')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('versus.wins')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('versus.draws')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('versus.losses')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('versus.points')}
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => (
                <motion.tr
                  key={standing.player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-[var(--border)] last:border-b-0 ${
                    index === 0 && isFinished ? 'bg-[var(--primary-light)]/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">
                    {standing.player.name}
                    {index === 0 && isFinished && (
                      <span className="ml-2 text-xs bg-[var(--primary)] text-white px-2 py-0.5 rounded-full">
                        🏆
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-[var(--text)]">
                    {standing.wins}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-[var(--text)]">
                    {standing.draws}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-[var(--text)]">
                    {standing.losses}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-bold text-[var(--primary)]">
                    {standing.points}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--text)]">{t('versus.matchesTitle')}</h2>

        {/* Pending matches */}
        {pendingMatches.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{t('versus.pendingN').replace('{n}', String(pendingMatches.length))}</h3>
            <div className="space-y-3">
              {pendingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onDragOver={onDragOver(index)}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop(index)}
                  className={`relative rounded-lg transition-colors ${
                    dragOverIndex === index ? 'bg-[var(--primary-light)]/30 ring-2 ring-[var(--primary)]' : ''
                  }`}
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={onDragStart(index)}
                      onDragEnd={onDragEnd}
                      className="p-2 text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--primary)] touch-none"
                      title={t('versus.reorderMatch')}
                      aria-label={t('versus.reorderMatch')}
                    >
                      <GripVertical size={18} />
                    </button>
                  </div>
                  <MatchResultCard
                    match={match}
                    hasScore={hasScore}
                    isEditable={isEditable}
                    onSaveResult={onSaveResult}
                    isBracket={false}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed matches */}
        {completedMatches.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-3">{t('versus.completedN').replace('{n}', String(completedMatches.length))}</h3>
            <div className="space-y-3">
              {completedMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onDragOver={onDragOver(index)}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop(index)}
                  className={`relative rounded-lg transition-colors ${
                    dragOverIndex === index ? 'bg-[var(--primary-light)]/30 ring-2 ring-[var(--primary)]' : ''
                  }`}
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={onDragStart(index)}
                      onDragEnd={onDragEnd}
                      className="p-2 text-[var(--text-muted)] cursor-grab active:cursor-grabbing hover:text-[var(--primary)] touch-none"
                      title={t('versus.reorderMatch')}
                      aria-label={t('versus.reorderMatch')}
                    >
                      <GripVertical size={18} />
                    </button>
                  </div>
                  <MatchResultCard
                    match={match}
                    hasScore={hasScore}
                    isEditable={false}
                    onSaveResult={onSaveResult}
                    isBracket={false}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Champion banner when finished */}
      {isFinished && champion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-xl p-6 text-center"
        >
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-xl font-bold text-white mb-1">{t('versus.championExclaim')}</h3>
          <p className="text-lg text-white/90">{champion.name}</p>
        </motion.div>
      )}
    </div>
  );
};
