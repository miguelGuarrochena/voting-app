'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ErrorState from '@/components/states/ErrorState';
import { HomeIcon, PlusCircleIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';

const NotFound = () => {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    // Log 404 for analytics
    console.log('404: Page not found', window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[var(--primary-light)] opacity-30 rounded-full blur-3xl transform -translate-x-16 -translate-y-16" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--primary-light)] opacity-20 rounded-full blur-3xl transform translate-x-32 translate-y-32" />
      
      <motion.div
        className="max-w-2xl w-full relative text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 404 Number */}
        <motion.div
          className="font-display text-8xl md:text-9xl font-bold text-gradient mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          404
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mb-6">
            <div className="w-20 h-20 bg-[var(--primary-light)] rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-10 h-10 text-[var(--primary)]" />
            </div>
            
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              Oops! Page not found
            </h1>
            
            <p className="font-body text-lg text-[var(--text-muted)] mb-6 leading-relaxed">
              Looks like you've wandered into uncharted territory. 
              The poll you're looking for might have expired, been deleted, or never existed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-[var(--radius-md)] hover:shadow-lg transition-all font-medium"
            >
              <HomeIcon className="w-5 h-5" />
              Go Home
            </Link>
            
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface-2)] transition-colors font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Create a Poll
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/votes"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium"
              >
                My Votes
              </Link>
              <Link
                href="/ranking"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium"
              >
                Rankings
              </Link>
              <Link
                href="/ratings"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium"
              >
                Ratings
              </Link>
              <Link
                href="/versus"
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium"
              >
                Versus
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Alternative Suggestions */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/')}>
            <div className="text-2xl mb-2">🗳️</div>
            <h3 className="font-display font-semibold text-[var(--text)] mb-1">Active Polls</h3>
            <p className="text-sm text-[var(--text-muted)]">Vote on what's happening now</p>
          </div>
          
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/create')}>
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-display font-semibold text-[var(--text)] mb-1">Create Poll</h3>
            <p className="text-sm text-[var(--text-muted)]">Start your own vote</p>
          </div>
          
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/spin')}>
            <ArrowPathIcon className="w-8 h-8 mb-2 mx-auto" />
            <h3 className="font-display font-semibold text-[var(--text)] mb-1">Spin Wheel</h3>
            <p className="text-sm text-[var(--text-muted)]">Make decisions fun</p>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.p
          className="text-sm text-[var(--text-muted)] mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {t('common.contactSupport')}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
