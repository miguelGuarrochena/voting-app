'use client';

import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

// ------------------------------------------------------------
//  WinnerPodium — top 3 when the poll finishes.
//  Used in votes / ranking / ratings when `expired === true`.
//  Expects the caller to filter out entries with 0 activity and only pass
//  those that actually won something (1 to 3 entries).
// ------------------------------------------------------------

export type PodiumEntry = {
  id: string;
  title: string;
  emoji?: string;
  imageUrl?: string;
  /** Primary metric already formatted (e.g. "12 votes", "⭐ 4.3"). */
  primary: string;
  /** Optional secondary metric (e.g. "42%", "8 ratings"). */
  secondary?: string;
};

type Props = {
  /** Top 1-3 already sorted (best first). Caller must filter zeros. */
  entries: PodiumEntry[];
  onZoomImage?: (url: string, alt: string) => void;
};

// Medallas y labels por puesto
const PLACE = {
  1: { medal: '🥇', label: '1º', barH: 'h-16 sm:h-20', bg: 'from-[#FFD54A] to-[#E6A820]' },
  2: { medal: '🥈', label: '2º', barH: 'h-10 sm:h-14', bg: 'from-[#D6DBE3] to-[#9CA3AF]' },
  3: { medal: '🥉', label: '3º', barH: 'h-7 sm:h-10',  bg: 'from-[#E2B078] to-[#A87038]' },
} as const;

export function WinnerPodium({ entries, onZoomImage }: Props) {
  if (!entries || entries.length === 0) return null;

  // Visual order: 2nd - 1st - 3rd. If missing, the column doesn't render.
  const visual: Array<{ entry: PodiumEntry | undefined; place: 1 | 2 | 3 }> = [
    { entry: entries[1], place: 2 },
    { entry: entries[0], place: 1 },
    { entry: entries[2], place: 3 },
  ];

  // If there's only one winner, center it.
  const onlyOne = entries.length === 1;

  return (
    <div className="mb-5 sm:mb-6">
      <div
        className={`grid items-end ${
          onlyOne ? 'grid-cols-1 max-w-[180px] sm:max-w-[220px] mx-auto' : 'grid-cols-3'
        }`}
      >
        {(onlyOne ? [{ entry: entries[0], place: 1 as const }] : visual).map(
          ({ entry, place }, idx) => {
            if (!entry) {
              // Empty column (when there's no 3rd place), placeholder to
              // maintain alignment
              return <div key={`empty-${place}`} aria-hidden />;
            }
            const step = PLACE[place];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 * idx, type: 'spring', stiffness: 240, damping: 22 }}
                className="flex flex-col items-stretch"
              >
                {/* Winner card */}
                <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-2 sm:p-3 mb-0 text-center shadow-sm">
                  {entry.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onZoomImage?.(entry.imageUrl!, entry.title)}
                      className="relative block w-full aspect-square mb-1.5 rounded-lg overflow-hidden cursor-zoom-in group"
                      aria-label={`Ver ${entry.title}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.imageUrl}
                        alt={entry.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                      <span className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center shadow-sm">
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={2.3} />
                      </span>
                    </button>
                  ) : (
                    <div className="w-full aspect-square mb-1.5 rounded-lg bg-[var(--primary-light)]/50 flex items-center justify-center text-3xl sm:text-4xl">
                      {entry.emoji || step.medal}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1 min-w-0">
                    {entry.emoji && entry.imageUrl && (
                      <span className="text-xs flex-shrink-0" aria-hidden>{entry.emoji}</span>
                    )}
                    <span className="text-[11px] sm:text-xs font-semibold text-[var(--text)] truncate">
                      {entry.title}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] sm:text-xs text-[var(--text)] font-bold">
                    {entry.primary}
                  </div>
                  {entry.secondary && (
                    <div className="text-[10px] text-[var(--text-muted)]">{entry.secondary}</div>
                  )}
                </div>

                {/* Escalón del podio — pegado a la card y al de al lado */}
                <div
                  className={`w-full ${step.barH} bg-gradient-to-b ${step.bg} flex items-center justify-center`}
                >
                  <div className="flex items-center gap-1 text-white drop-shadow-sm">
                    <span className="text-base sm:text-lg" aria-hidden>{step.medal}</span>
                    <span className="text-[11px] sm:text-xs font-bold">{step.label}</span>
                  </div>
                </div>
              </motion.div>
            );
          }
        )}
      </div>
    </div>
  );
}
