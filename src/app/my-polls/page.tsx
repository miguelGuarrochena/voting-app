'use client';

import { useEffect, useState } from 'react';
import usePollStore from '@/store/pollStore';
import { PollCard } from '@/components/poll/PollCard';

export default function MyPollsPage() {
  const { getMyPolls, polls } = usePollStore();
  const [mounted, setMounted] = useState(false);

  // Current user ID (in a real app, this would come from auth context)
  const currentUserId = 'current-user';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-[var(--text)] mb-8">My Polls</h1>

      {/* Public Polls Section */}
      <div className="mb-12">
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
          <span>🌍</span>
          <span>My Public Polls</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicPolls.map(poll => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </div>

      {/* Private Polls Section */}
      <div className="mb-12">
        <h2 className="font-display text-xl font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
          <span>🔒</span>
          <span>My Private Polls</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {privatePolls.map(poll => (
              <div key={poll.id} className="relative">
                <div className="absolute top-2 right-2 z-10 bg-gray-900/80 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  🔒 Private
                </div>
                <PollCard poll={poll} />
              </div>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}
