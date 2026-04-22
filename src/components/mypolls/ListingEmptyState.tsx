'use client';

import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface ListingEmptyStateProps {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaHref: string;
  ctaLabel: string;
}

/**
 * Estado vacío unificado para los listados (vote/ranking/rating/versus).
 * Muestra un CTA grande para crear — por eso el header de la página debe ocultar
 * su botón de crear cuando está vacío (para evitar 2 botones duplicados).
 */
export function ListingEmptyState({
  emoji,
  icon,
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: ListingEmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 px-4">
      {icon ? (
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--primary)]/10 mb-5 sm:mb-6">
          {icon}
        </div>
      ) : emoji ? (
        <div className="text-5xl sm:text-6xl mb-4">{emoji}</div>
      ) : null}
      <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2">
        {title}
      </h3>
      {subtitle && (
        <p className="text-[var(--text-muted)] text-sm sm:text-base mb-6 max-w-md mx-auto">
          {subtitle}
        </p>
      )}
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-[var(--primary-dark)] hover:shadow-lg transition-all"
      >
        <PlusIcon className="w-5 h-5" />
        <span>{ctaLabel}</span>
      </Link>
    </div>
  );
}
