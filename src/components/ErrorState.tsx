'use client';

import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  icon?: 'error' | 'warning' | 'empty';
  compact?: boolean;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
  onGoHome,
  icon = 'error',
  compact = false
}: ErrorStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'warning':
        return <ExclamationTriangleIcon className="w-16 h-16 text-amber-500" />;
      case 'empty':
        return (
          <div className="w-16 h-16 bg-[var(--surface-2)] rounded-full flex items-center justify-center">
            <span className="text-3xl">📭</span>
          </div>
        );
      default:
        return <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />;
    }
  };

  const getColors = () => {
    switch (icon) {
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          muted: 'text-amber-600'
        };
      case 'empty':
        return {
          bg: 'bg-[var(--surface-2)]',
          border: 'border-[var(--border)]',
          text: 'text-[var(--text)]',
          muted: 'text-[var(--text-muted)]'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          muted: 'text-red-600'
        };
    }
  };

  const colors = getColors();

  if (compact) {
    return (
      <motion.div
        className={`${colors.bg} ${colors.border} border rounded-[var(--radius-md)] p-4 text-center`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-center mb-3">
          {getIcon()}
        </div>
        <h3 className={`font-medium ${colors.text} mb-1`}>{title}</h3>
        <p className={`text-sm ${colors.muted} mb-4`}>{message}</p>
        <div className="flex gap-2 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--primary-dark)] transition-colors text-sm font-medium"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Try Again
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors text-sm font-medium"
            >
              <HomeIcon className="w-4 h-4" />
              Go Home
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] px-4 py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className={`${colors.bg} ${colors.border} border rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] p-8 max-w-md w-full text-center`}>
        <div className="flex justify-center mb-6">
          {getIcon()}
        </div>
        
        <h1 className={`font-display text-2xl font-bold ${colors.text} mb-3`}>
          {title}
        </h1>
        
        <p className={`font-body ${colors.muted} mb-8 leading-relaxed`}>
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-[var(--radius-md)] hover:shadow-lg transition-all font-medium"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Try Again
            </button>
          )}
          
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface-2)] transition-colors font-medium"
            >
              <HomeIcon className="w-5 h-5" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
