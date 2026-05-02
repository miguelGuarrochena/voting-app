'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { MoreVertical, Trash2, Edit3, Clock } from 'lucide-react';

export type OwnerMenuVariant = 'default' | 'warning' | 'danger';

export interface OwnerMenuItem {
  /** Item label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon (a default is picked from the variant when omitted) */
  icon?: ReactNode;
  /** Item style */
  variant?: OwnerMenuVariant;
  /** Show a separator above this item */
  divider?: boolean;
  /** Disable the item (renders gray, doesn't fire onClick) */
  disabled?: boolean;
}

interface OwnerMenuProps {
  /** Menu items. Rendered in order. */
  items: OwnerMenuItem[];
  /** aria-label for the kebab trigger */
  ariaLabel?: string;
  /** Extra classes */
  className?: string;
}

const variantClasses: Record<OwnerMenuVariant, string> = {
  default: 'text-[var(--text)] hover:bg-[var(--surface-2)]',
  warning: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10',
  danger: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10',
};

/**
 * Creator-only actions menu (kebab ⋮).
 * Used in the header of the [token] pages for votes/ranking/ratings/versus,
 * shown only when the current user is the creator.
 *
 * Supports multiple items with icon/variant/divider/disabled.
 *
 * - Toggles open on button click.
 * - Closes on outside click or Escape key.
 */
export function OwnerMenu({ items, ariaLabel, className = '' }: OwnerMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel || 'Actions'}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors flex-shrink-0"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-40 min-w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
        >
          {items.map((item, idx) => {
            const variant = item.variant ?? 'default';
            const IconNode = item.icon;
            return (
              <div key={idx}>
                {item.divider && <div className="h-px bg-[var(--border)]" />}
                <button
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                    item.disabled
                      ? 'text-[var(--text-muted)] opacity-60 cursor-not-allowed'
                      : variantClasses[variant]
                  }`}
                >
                  {IconNode ?? <DefaultIcon variant={variant} />}
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DefaultIcon({ variant }: { variant: OwnerMenuVariant }) {
  if (variant === 'danger') return <Trash2 size={16} />;
  if (variant === 'warning') return <Clock size={16} />;
  return <Edit3 size={16} />;
}
