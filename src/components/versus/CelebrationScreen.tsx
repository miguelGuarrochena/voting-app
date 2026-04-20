'use client';

import { VersusOption } from '@/types/versus';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface CelebrationScreenProps {
  champion: VersusOption;
  tournamentTitle: string;
  onShareResult: () => void;
}

export const CelebrationScreen = ({ champion, tournamentTitle, onShareResult }: CelebrationScreenProps) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopyResult = async () => {
    const resultText = `${champion.title} ${t('versus.wonTournament')} '${tournamentTitle}' ${t('versus.inPickly')} 🏆`;
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)] p-8 max-w-md w-full text-center"
      >
        {/* Trophy */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-8xl mb-6"
        >
          🏆
        </motion.div>

        {/* Champion */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-[var(--text)] mb-2"
        >
          {champion.title}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[var(--text-muted)] mb-8"
        >
          {t('versus.isChampionOf')} {tournamentTitle}!
        </motion.p>

        {/* Share Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleCopyResult}
          className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? t('versus.copied') : t('versus.shareResult')}
        </motion.button>

        {/* Confetti emojis */}
        <div className="absolute -top-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🎉</div>
        <div className="absolute -top-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
        <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>
        <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: '0.6s' }}>🎉</div>
      </motion.div>
    </div>
  );
};
