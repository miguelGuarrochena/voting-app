'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Swords, Trophy, Clock, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { ListingEmptyState } from '@/components/mypolls/ListingEmptyState';
import {
  getMyPolls,
  removeMyPoll,
  pruneExpiredMyPolls,
  type MyPollEntry,
} from '@/lib/mypolls';
import { formatTimeRemaining, getTimeRemaining } from '@/lib/token';

/**
 * Listing de torneos Versus.
 * Rediseñado para ser más atractivo: hero con gradiente, split creador/participante,
 * cards con badge de estado y CTA prominente.
 */
export default function VersusPage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<MyPollEntry[]>([]);

  const refresh = useCallback(() => {
    pruneExpiredMyPolls();
    setEntries(getMyPolls('versus'));
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  const handleRemove = (token: string) => {
    removeMyPoll(token);
    toast.success(t('common.removed'));
    refresh();
  };

  const { created, joined } = useMemo(() => {
    return {
      created: entries.filter((e) => e.role === 'creator'),
      joined: entries.filter((e) => e.role === 'participant'),
    };
  }, [entries]);

  if (!mounted) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          <p className="text-gray-600 mt-4">{t('common.loading')}</p>
        </div>
      </PageLayout>
    );
  }

  const isEmpty = entries.length === 0;

  return (
    <>
      <PageLayout className="pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero — card blanca, limpio, sin gradient */}
          <div className="mb-6 sm:mb-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                  <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-[var(--text)]">
                    {t('versus.heroTitle')}
                  </h1>
                  <p className="text-[var(--text-muted)] text-sm sm:text-base mt-1 max-w-md">
                    {t('versus.heroSubtitle')}
                  </p>
                </div>
              </div>

              {/* Botón en el hero solo si ya hay torneos (si está vacío, el CTA es el del EmptyState) */}
              {!isEmpty && (
                <Link
                  href="/versus/create"
                  className="hidden sm:inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-4 sm:px-5 py-2.5 rounded-full font-semibold hover:bg-[var(--primary-dark)] hover:shadow-lg transition-all whitespace-nowrap self-start sm:self-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>{t('versus.createTournament')}</span>
                </Link>
              )}
            </div>

            {/* stats row */}
            {!isEmpty && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-[var(--border)]">
                <StatChip icon={<Trophy className="w-4 h-4 text-[var(--primary)]" />} label={t('versus.createdSection')} value={created.length} />
                <StatChip icon={<Users className="w-4 h-4 text-[var(--primary)]" />} label={t('versus.joinedSection')} value={joined.length} />
                <StatChip icon={<Clock className="w-4 h-4 text-[var(--primary)]" />} label={t('versus.active')} value={entries.length} />
              </div>
            )}
          </div>

          {/* Content */}
          {isEmpty ? (
            <ListingEmptyState
              icon={<Swords className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--primary)]" />}
              title={t('versus.emptyTitle')}
              subtitle={t('versus.emptyState')}
              ctaHref="/versus/create"
              ctaLabel={t('versus.emptyCta')}
            />
          ) : (
            <div className="space-y-8">
              {created.length > 0 && (
                <Section title={t('versus.createdSection')} icon={<Trophy className="w-5 h-5 text-[var(--primary)]" />}>
                  {created.map((e) => (
                    <VersusCard key={e.token} entry={e} onRemove={handleRemove} t={t} />
                  ))}
                </Section>
              )}
              {joined.length > 0 && (
                <Section title={t('versus.joinedSection')} icon={<Users className="w-5 h-5 text-[var(--primary)]" />}>
                  {joined.map((e) => (
                    <VersusCard key={e.token} entry={e} onRemove={handleRemove} t={t} />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </PageLayout>

      {/* Mobile FAB - outside PageLayout to avoid positioning issues */}
      {!isEmpty && (
        <Link
          href="/versus/create"
          className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50"
          aria-label={t('versus.createTournament')}
        >
          <PlusIcon className="w-6 h-6" />
        </Link>
      )}
    </>
  );
}

/* ---------- helpers (privados a este archivo) ---------- */

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-base sm:text-lg font-bold text-[var(--text)] leading-none">{value}</div>
        <div className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function VersusCard({
  entry,
  onRemove,
  t,
}: {
  entry: MyPollEntry;
  onRemove: (token: string) => void;
  t: (key: string) => string;
}) {
  const expired = entry.expiresAt
    ? getTimeRemaining(new Date(entry.expiresAt)) <= 0
    : false;

  const remainingMs = entry.expiresAt ? getTimeRemaining(new Date(entry.expiresAt)) : null;
  const timeLabel = remainingMs !== null && !expired ? formatTimeRemaining(remainingMs) : null;

  return (
    <div className="relative group">
      <Link
        href={`/versus/${entry.token}`}
        className="block h-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-xl hover:-translate-y-0.5 transition-all p-5 min-w-0"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white flex-shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--text)] truncate">{entry.title}</h3>
            {entry.createdBy && entry.role === 'participant' && (
              <p className="text-xs text-[var(--text-muted)] truncate">
                {t('versus.by')} {entry.createdBy}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={
              entry.role === 'creator'
                ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/15 text-[var(--primary)]'
                : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--border)]/50 text-[var(--text-muted)]'
            }
          >
            {entry.role === 'creator' ? t('common.createdByYou') : t('common.sharedWithYou')}
          </span>

          {timeLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Clock className="w-3 h-3" />
              {timeLabel}
            </span>
          )}

          {expired && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {t('versus.expired')}
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(entry.token);
        }}
        aria-label={t('common.remove')}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 hover:text-red-500 transition-opacity flex items-center justify-center"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
