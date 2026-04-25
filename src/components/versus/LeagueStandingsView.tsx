'use client';

import { LeagueMatch, LeagueStanding, Player } from '@/types/versus';
import { motion } from 'framer-motion';
import { MatchResultCard } from './MatchResultCard';
import { useLanguage } from '@/context/LanguageContext';

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

  const completedMatches = matches.filter(m => m.status === 'completed');
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const isFinished = champion !== null;

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
                >
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
                >
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
