'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditTitleModalProps {
  isOpen: boolean;
  initialTitle: string;
  onClose: () => void;
  /** Se llama con el nuevo título; debe devolver true si el save fue OK. */
  onSave: (newTitle: string) => Promise<boolean> | boolean;
  title: string; // label del modal (ej "Editar título")
  subtitle?: string;
  cancelText: string;
  saveText: string;
  placeholder?: string;
  /** Máximo de caracteres. Default 100. */
  maxLength?: number;
}

/**
 * Reusable title-edit modal.
 * - Enter = save, Esc = cancel.
 * - Auto-selects the text on open.
 * - Disables save when the title equals the original or is empty.
 * - Shows a character counter.
 */
export default function EditTitleModal({
  isOpen,
  initialTitle,
  onClose,
  onSave,
  title,
  subtitle,
  cancelText,
  saveText,
  placeholder,
  maxLength = 100,
}: EditTitleModalProps) {
  const [value, setValue] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open / close
  useEffect(() => {
    if (isOpen) {
      setValue(initialTitle);
      setSaving(false);
      // Auto-select on mount
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== initialTitle.trim() && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave(trimmed);
    setSaving(false);
    if (ok) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 w-screen h-screen bg-black bg-opacity-75 z-[9999] flex items-center justify-center"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--surface)] rounded-xl max-w-md w-full m-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[var(--text)] mb-1">{title}</h2>
            {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={saving}
            className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-60"
          />
          <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
            {value.length}/{maxLength}
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--surface-2)] transition-colors font-medium disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? '…' : saveText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
