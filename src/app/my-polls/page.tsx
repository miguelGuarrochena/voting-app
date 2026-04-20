'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import usePollStore from '@/store/pollStore';
import { PollCard } from '@/components/poll/PollCard';
import { useLanguage } from '@/context/LanguageContext';

export default function MyPollsPage() {
  const { getMyPolls, polls, deletePoll } = usePollStore();
  const { t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<string | null>(null);

  // Current user ID (in a real app, this would come from auth context)
  const currentUserId = 'current-user';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleDelete = () => {
    if (pollToDelete) {
      deletePoll(pollToDelete);
      setShowDeleteDialog(false);
      setPollToDelete(null);
    }
  };

  const myPolls = getMyPolls(currentUserId);

  return (
    <>
    <div className="px-3 sm:px-6 py-8 pb-24 md:pb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--text)] mb-8">{t('poll.myPolls')}</h1>

      {/* My Polls Section */}
      <div className="mb-12">
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
          <span>📊</span>
          <span>My Polls</span>
          <span className="text-sm font-normal text-[var(--text-muted)]">({myPolls.length})</span>
        </h2>

        {myPolls.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-semibold text-[var(--text)] text-lg mb-2">{t('myPolls.noPublicPolls')}</h3>
            <p className="text-[var(--text-muted)] mb-6">{t('myPolls.createFirstPublic')}</p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              {t('myPolls.createPoll')}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {myPolls.map(poll => {
              const hasEnded = new Date(poll.expiresAt) <= new Date();
              return (
                <PollCard 
                  key={poll.id} 
                  poll={poll} 
                  onDelete={poll.createdBy === currentUserId && !hasEnded ? (pollId) => {
                    setPollToDelete(pollId);
                    setShowDeleteDialog(true);
                  } : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t('poll.deletePoll')}</h3>
            <p className="text-[var(--text-muted)] mb-6">
              {t('poll.deleteConfirm')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPollToDelete(null);
                }}
                className="px-4 py-2 text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg font-medium transition-colors"
              >
                {t('poll.cancel')}
              </button>
              <button
                onClick={() => {
                  if (pollToDelete) {
                    handleDelete();
                  }
                  setShowDeleteDialog(false);
                  setPollToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                {t('poll.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
