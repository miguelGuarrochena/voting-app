'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import usePollStore from '@/store/pollStore';

export default function InvitePage() {
  const router = useRouter();
  const { token } = useParams();
  const { getPollByInviteToken, inviteUserToPoll } = usePollStore();
  const [poll, setPoll] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  // Current user ID (in a real app, this would come from auth context)
  const currentUserId = 'current-user';

  useEffect(() => {
    const pollData = getPollByInviteToken(token as string);
    if (!pollData) {
      setError('Invalid or expired invite link');
      setIsLoading(false);
      return;
    }

    setPoll(pollData);

    // Check if user is already invited or is the creator
    const isCreator = pollData.createdBy === currentUserId;
    const isInvited = pollData.invitedUsers?.includes(currentUserId);

    if (isCreator || isInvited) {
      // Redirect directly to poll page
      router.push(`/polls/${pollData.id}`);
    } else {
      setIsLoading(false);
    }
  }, [token, getPollByInviteToken, router, currentUserId]);

  const handleAcceptInvite = () => {
    if (!poll) return;

    setIsAccepting(true);
    inviteUserToPoll(poll.id, currentUserId);

    // Redirect to poll page after a short delay
    setTimeout(() => {
      router.push(`/polls/${poll.id}`);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)] p-8 text-center">
            <div className="text-6xl mb-4">🔗</div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Invalid Invite Link</h1>
            <p className="text-[var(--text-muted)] mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-[var(--surface)] text-[var(--text)] rounded-xl font-medium hover:bg-[var(--surface-2)] transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)] p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📨</div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">You're Invited!</h1>
            <p className="text-[var(--text-muted)] mb-6">
              <strong>{poll.createdBy}</strong> has invited you to participate in a poll.
            </p>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 text-left">
              <h2 className="font-semibold text-[var(--text)] mb-2">{poll.title}</h2>
              {poll.description && (
                <p className="text-sm text-[var(--text-muted)]">{poll.description}</p>
              )}
            </div>

            <button
              onClick={handleAcceptInvite}
              disabled={isAccepting}
              className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAccepting ? 'Accepting...' : 'Accept Invite & View Poll'}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full mt-3 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
