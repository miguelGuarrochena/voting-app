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
  const publicPolls = myPolls.filter(p => !p.isPrivate);
  const privatePolls = myPolls.filter(p => p.isPrivate === true);

  // Polls the user is invited to (but didn't create)
  const invitedPolls = polls.filter(p =>
    p.isPrivate === true &&
    p.invitedUsers?.includes(currentUserId) &&
    p.createdBy !== currentUserId
  );

  return (
    <>
    <div className="px-3 sm:px-6 py-8 pb-24 md:pb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--text)] mb-8">{t('poll.myPolls')}</h1>

      {/* Public Polls Section */}
      <div className="mb-12">
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
          <span>🌍</span>
          <span>{t('poll.myPublicPolls')}</span>
          <span className="text-sm font-normal text-[var(--text-muted)]">({publicPolls.length})</span>
        </h2>

        {publicPolls.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-semibold text-[var(--text)] text-lg mb-2">No public polls yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Create your first public poll to share with everyone!</p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              Create Poll
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {publicPolls.map(poll => {
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

      {/* Private Polls Section */}
      <div className="mb-12">
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
          <span>🔒</span>
          <span>{t('poll.myPrivatePolls')}</span>
          <span className="text-sm font-normal text-[var(--text-muted)]">({privatePolls.length})</span>
        </h2>

        {privatePolls.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="font-semibold text-[var(--text)] text-lg mb-2">No private polls yet</h3>
            <p className="text-[var(--text-muted)] mb-6">Create a private poll to share only with specific participants.</p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
            >
              Create Private Poll
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {privatePolls.map(poll => {
              const hasEnded = new Date(poll.expiresAt) <= new Date();
              return (
                <div key={poll.id} className="relative">
                  <div className="absolute top-2 right-2 z-10 bg-gray-900/80 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    🔒 {t('poll.private')}
                  </div>
                  <PollCard 
                    poll={poll} 
                    onDelete={poll.createdBy === currentUserId && !hasEnded ? (pollId) => {
                      setPollToDelete(pollId);
                      setShowDeleteDialog(true);
                    } : undefined}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Polls I'm Invited To Section */}
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
          <span>📨</span>
          <span>Polls I'm Invited To</span>
          <span className="text-sm font-normal text-[var(--text-muted)]">({invitedPolls.length})</span>
        </h2>

        {invitedPolls.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="font-semibold text-[var(--text)] text-lg mb-2">No pending invites</h3>
            <p className="text-[var(--text-muted)]">When someone invites you to a private poll, it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {invitedPolls.map(poll => (
              <div key={poll.id} className="relative">
                <div className="absolute top-2 right-2 z-10 bg-blue-600/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  🔒 Invited
                </div>
                <PollCard poll={poll} />
                <div className="mt-2 text-xs text-[var(--text-muted)] text-center">
                  Created by {poll.createdBy}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State - No polls at all */}
      {myPolls.length === 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="font-semibold text-[var(--text)] text-lg mb-2">You haven't created any polls yet</h3>
          <p className="text-[var(--text-muted)] mb-6">Start by creating your first poll!</p>
          <a
            href="/create"
            className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--primary-dark)] transition-colors"
          >
            Create Your First Poll
          </a>
        </div>
      )}
    </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('poll.deletePoll')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('poll.deleteConfirm')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPollToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
              >
                {t('poll.cancel')}
              </button>
              <button
                onClick={() => {
                  if (pollToDelete) {
                    handleDelete(pollToDelete);
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
