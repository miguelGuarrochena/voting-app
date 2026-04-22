'use client';

import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { MyPollEntry } from '@/lib/mypolls';
import { formatTimeRemaining, getTimeRemaining } from '@/lib/token';
import { useLanguage } from '@/context/LanguageContext';

interface MyPollCardProps {
  entry: MyPollEntry;
  href: string;
  onRemove?: (token: string) => void;
  meta?: React.ReactNode; // ej: "N opciones", etc.
}

/**
 * Card genérico para los listados de "mis polls" (vote/ranking/rating/versus).
 * Muestra:
 *  - Título
 *  - Badge "Creado por ti" o "Compartido contigo"
 *  - Autor (si existe y no es uno mismo)
 *  - Estado de expiración
 *  - Botón opcional para removerlo del localStorage
 */
export function MyPollCard({ entry, href, onRemove, meta }: MyPollCardProps) {
  const { t } = useLanguage();

  const expired = entry.expiresAt
    ? getTimeRemaining(new Date(entry.expiresAt)) <= 0
    : false;

  const expiresLabel = entry.expiresAt && !expired
    ? t('common.expiresIn').replace(
        '{time}',
        formatTimeRemaining(getTimeRemaining(new Date(entry.expiresAt)))
      )
    : expired
      ? t('common.expired')
      : null;

  return (
    <div className="relative group">
      <Link
        href={href}
        className="block bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-lg transition-all p-5 min-w-0"
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[var(--text)] mb-1 truncate">
              {entry.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
              <span
                className={
                  entry.role === 'creator'
                    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--border)]/50 text-[var(--text-muted)]'
                }
              >
                {entry.role === 'creator'
                  ? t('common.createdByYou')
                  : t('common.sharedWithYou')}
              </span>

              {entry.createdBy && entry.role === 'participant' && (
                <span className="truncate max-w-[160px]">· {entry.createdBy}</span>
              )}

              {meta && <span>· {meta}</span>}

              {expiresLabel && (
                <span className={expired ? 'text-red-500' : ''}>
                  · {expiresLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(entry.token);
          }}
          aria-label={t('common.remove')}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-500 transition-opacity flex items-center justify-center"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
