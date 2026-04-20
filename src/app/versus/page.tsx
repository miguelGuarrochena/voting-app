'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swords, Plus } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { getPollData, isExpired } from '@/lib/token';
import { VersusTournament } from '@/types/versus';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function VersusPage() {
  const [tournaments, setTournaments] = useState<VersusTournament[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadTournaments();
  }, []);

  const loadTournaments = () => {
    const allTournaments: VersusTournament[] = [];

    // Scan localStorage for versus tournaments
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only get tournament data, not duel votes (which have _duel_ in the key)
      if (key?.startsWith('pickly_versus_') && !key.includes('_duel_')) {
        try {
          const item = localStorage.getItem(key);
          if (!item || item.trim() === '') {
            console.warn('Empty or null data for key:', key);
            continue;
          }
          const data = JSON.parse(item);
          if (data && data.token) {
            allTournaments.push(data);
          }
        } catch (e) {
          console.error('Error parsing tournament data for key', key, ':', e);
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    }

    // Sort by creation date (newest first)
    allTournaments.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setTournaments(allTournaments);
  };

  const getStatusInfo = (tournament: VersusTournament) => {
    const now = new Date();
    const expiresAt = new Date(tournament.expiresAt);
    const isTournamentExpired = isExpired(expiresAt);
    const isFinished = tournament.bracket.status === 'finished';
    
    if (isFinished || isTournamentExpired) {
      return {
        text: 'Terminada',
        bgColor: '#2a2a2a',
        textColor: '#a0a0a0',
      };
    }
    
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 2) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const timeText = hours > 0 ? `Cierra en ${hours}h ${minutes}m` : `Cierra en ${minutes}m`;
      return {
        text: timeText,
        bgColor: '#7a3200',
        textColor: '#ffffff',
      };
    }
    
    return {
      text: 'Activa',
      bgColor: '#1a5c3a',
      textColor: '#ffffff',
    };
  };

  if (!mounted) return null;

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
              <Swords className="w-8 h-8 sm:w-10 sm:h-10" />
              Versus
            </h1>
            <p className="text-[var(--text-muted)]">
              Tournament-style elimination brackets
            </p>
          </div>
          <Link
            href="/versus/create"
            className="bg-[var(--primary)] text-white px-4 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create</span>
          </Link>
        </div>

        {/* Tournament List */}
        {tournaments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚔️</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">
              No tournaments yet
            </h2>
            <p className="text-[var(--text-muted)] mb-6">
              Create your first Versus tournament and start the competition!
            </p>
            <Link
              href="/versus/create"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              <Plus size={18} />
              Create Tournament
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {tournaments.map((tournament, index) => {
              const status = getStatusInfo(tournament);
              const champion = tournament.bracket.champion;
              
              return (
                <motion.div
                  key={tournament.token}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/versus/${tournament.token}`}
                    className="block bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--text)] mb-1">
                          {tournament.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                          <span>{tournament.options.length} options</span>
                          <span>•</span>
                          <span>{tournament.votesToWin} votes to win</span>
                          <span>•</span>
                          <span>by {tournament.createdBy}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: status.bgColor,
                            color: status.textColor,
                          }}
                        >
                          {status.text}
                        </div>
                        {champion && (
                          <div className="text-sm font-medium text-[var(--primary)]">
                            🏆 {champion.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
