'use client';

import { motion } from 'framer-motion';
import {
  PlusCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import {
  PlusCircleIcon as PlusCircleSolid,
  ChatBubbleLeftRightIcon as ChatBubbleSolid,
  HeartIcon as HeartSolid,
  FireIcon as FireSolid
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface EmptyPollsStateProps {
  onRefresh?: () => void;
  loading?: boolean;
}

const EmptyPollsState = ({ onRefresh, loading = false }: EmptyPollsStateProps) => {
  const { t } = useLanguage();
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[600px] px-4 py-16 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] opacity-10 rounded-full blur-3xl transform -translate-x-32 -translate-y-32" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[var(--primary-light)] to-[var(--warning)] opacity-10 rounded-full blur-3xl transform translate-x-48 translate-y-48" />
      <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-[var(--success)] to-[var(--primary)] opacity-5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />

      <div className="relative text-center max-w-2xl">
        {/* Main Illustration */}
        <motion.div
          className="relative mb-12"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Central Circle */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] rounded-full flex items-center justify-center">
              <SparklesIcon className="w-16 h-16 text-white" />
            </div>
            
            {/* Floating Icons */}
            <motion.div
              className="absolute -top-8 -left-8 w-12 h-12 bg-[var(--surface)] rounded-full shadow-lg flex items-center justify-center border-2 border-[var(--primary)]"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChatBubbleSolid className="w-6 h-6 text-[var(--primary)]" />
            </motion.div>
            
            <motion.div
              className="absolute -top-4 -right-12 w-10 h-10 bg-[var(--surface)] rounded-full shadow-lg flex items-center justify-center border-2 border-[var(--warning)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <HeartSolid className="w-5 h-5 text-[var(--warning)]" />
            </motion.div>
            
            <motion.div
              className="absolute -bottom-6 -left-10 w-11 h-11 bg-[var(--surface)] rounded-full shadow-lg flex items-center justify-center border-2 border-[var(--success)]"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <FireSolid className="w-5 h-5 text-[var(--success)]" />
            </motion.div>
            
            <motion.div
              className="absolute -bottom-4 -right-8 w-9 h-9 bg-[var(--surface)] rounded-full shadow-lg flex items-center justify-center border-2 border-[var(--error)]"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <PlusCircleSolid className="w-4 h-4 text-[var(--error)]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-display text-4xl md:text-5xl font-bold text-[var(--text)] mb-6 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t('empty.createFirstPoll')}
        </motion.h1>

        {/* Description */}
        <motion.p
          className="font-body text-xl text-[var(--text-muted)] mb-12 leading-relaxed max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {t('empty.description')}
        </motion.p>

        {/* Main Action Button */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link
            href="/create"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-full font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-dark)] to-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <PlusCircleIcon className="w-6 h-6" />
              <span>{t('empty.createPollNow')}</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.div>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-[var(--surface)] border-2 border-[var(--border)] rounded-full font-medium hover:bg-[var(--surface-2)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{loading ? t('common.searching') : t('common.refresh')}</span>
            </button>
          )}
          
          <Link
            href="/spin"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--warning)] to-[var(--warning)]/80 text-white rounded-full font-medium hover:shadow-lg transition-all transform hover:scale-105"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>{t('empty.tryWheel')}</span>
          </Link>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            className="group bg-[var(--surface)] rounded-[2rem] border-2 border-[var(--border)] p-8 hover:border-[var(--primary)] hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 relative overflow-hidden"
            whileHover={{ y: -5 }}
            onClick={() => window.open('/create', '_self')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-light)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <ChatBubbleSolid className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--text)] mb-3">{t('empty.easyVoting')}</h3>
              <p className="text-[var(--text-muted)]">{t('empty.easyVotingDesc')}</p>
            </div>
          </motion.div>
          
          <motion.div
            className="group bg-[var(--surface)] rounded-[2rem] border-2 border-[var(--border)] p-8 hover:border-[var(--warning)] hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 relative overflow-hidden"
            whileHover={{ y: -5 }}
            onClick={() => window.open('/spin', '_self')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--warning-light)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--warning)] to-[var(--warning)]/80 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <ArrowPathIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--text)] mb-3">{t('empty.decisionWheel')}</h3>
              <p className="text-[var(--text-muted)]">{t('empty.decisionWheelDesc')}</p>
            </div>
          </motion.div>
          
          <motion.div
            className="group bg-[var(--surface)] rounded-[2rem] border-2 border-[var(--border)] p-8 hover:border-[var(--success)] hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 relative overflow-hidden"
            whileHover={{ y: -5 }}
            onClick={() => window.open('/trending', '_self')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--success-light)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--success)] to-[var(--success)]/80 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <FireSolid className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--text)] mb-3">{t('empty.trending')}</h3>
              <p className="text-[var(--text-muted)]">{t('empty.trendingDesc')}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Fun Message */}
        <motion.p
          className="text-[var(--text-muted)] text-center relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] rounded-full">
            <span className="text-lg">💡</span>
            <span className="text-sm font-medium">{t('empty.bestDecisions')}</span>
            <span className="text-lg">💡</span>
          </span>
        </motion.p>
      </div>
    </motion.div>
  );
};

export default EmptyPollsState;
