'use client';

import Link from 'next/link';
import { Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExpiredTournament = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)] p-8 max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="text-6xl mb-4">🏆</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
          Este torneo ya no existe
        </h1>

        {/* Subtitle */}
        <p className="text-[var(--text-muted)] mb-6">
          Puede que haya terminado o que el link haya expirado
        </p>

        {/* Create New Button */}
        <Link
          href="/versus/create"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors"
        >
          <Swords size={18} />
          ¡Crear uno nuevo!
        </Link>
      </motion.div>
    </div>
  );
};
