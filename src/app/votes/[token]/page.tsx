'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPollData, isExpired, hasVoted, markAsVoted, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { PageLayout } from '@/components/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import Link from 'next/link';
import { Share2, ArrowLeft } from 'lucide-react';
import Toast from '@/components/ui/Toast';

export default function VoteTokenPage() {
  const params = useParams();
  const { username } = useUsername();
  const token = params.token as string;
  const [pollData, setPollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  useEffect(() => {
    // Show toast if just created
    if (justCreated) {
      setToastMessage('¡Voto creado con éxito! 🎉');
      setShowToast(true);
      // Remove the query param from URL without triggering a reload
      window.history.replaceState({}, '', `/votes/${token}`);
    }

    // Load poll data from localStorage
    const data = getPollData(token, 'vote');
    if (!data) {
      setError('Poll not found');
      setLoading(false);
      return;
    }

    setPollData(data);
    setExpired(isExpired(new Date(data.expiresAt)));
    setTimeRemaining(getTimeRemaining(new Date(data.expiresAt)));
    setHasVotedState(hasVoted(token, 'vote'));
    setLoading(false);

    // Update time remaining every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(new Date(data.expiresAt));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  const handleVote = () => {
    if (!selectedOption || !pollData) return;

    // Mark as voted
    markAsVoted(token, 'vote');
    setHasVotedState(true);

    // Update poll data with new vote
    const updatedOptions = pollData.options.map((opt: any) => {
      if (opt.id === selectedOption) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      votes: [...pollData.votes, { optionId: selectedOption, voter: username || 'Anonymous', timestamp: new Date().toISOString() }],
    };

    setPollData(updatedPollData);

    // Store updated data in localStorage
    localStorage.setItem(`pickly_vote_${token}`, JSON.stringify(updatedPollData));
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage('¡Link copiado! 🎉');
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/votes"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Poll not found</h2>
            <p className="text-[var(--text-muted)] mb-6">This poll may have been deleted or the link is invalid.</p>
            <Link href="/" className="text-[var(--primary)] hover:underline">
              Go back home
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (expired) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/votes"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
          <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">¡Se acabó el tiempo! 🎉</h2>
            <p className="text-[var(--text-muted)] mb-6">This poll has expired. Here are the final results:</p>

            {/* Results */}
            <div className="space-y-4 mb-6">
              {pollData.options
                .sort((a: any, b: any) => b.votes - a.votes)
                .map((option: any) => {
                  const totalVotes = pollData.options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  const voters = pollData.votes.filter((v: any) => v.optionId === option.id).map((v: any) => v.voter);

                  return (
                    <div key={option.id} className="bg-[var(--surface-2)] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[var(--text)]">{option.title}</span>
                        <span className="text-[var(--text-muted)]">{option.votes} votes ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-[var(--bg)] rounded-full h-2">
                        <div
                          className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {voters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {voters.map((voter: string, idx: number) => (
                            <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                              {voter}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <Link href="/" className="text-[var(--primary)] hover:underline">
              Create your own poll
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header with Share button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/votes"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text)]">{pollData.title}</h1>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors font-medium"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>

        {/* Countdown */}
        <div className="bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-[var(--text-muted)] mb-1">Time remaining</p>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {formatTimeRemaining(timeRemaining)}
          </p>
        </div>

        {/* Poll Card */}
        <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8">
          {pollData.description && (
            <p className="text-[var(--text-muted)] mb-6">{pollData.description}</p>
          )}

          {hasVotedState ? (
            /* Show Results */
            <div className="space-y-4">
              <p className="text-[var(--text-muted)] mb-4">You have already voted. Here are the current results:</p>
              {pollData.options
                .sort((a: any, b: any) => b.votes - a.votes)
                .map((option: any) => {
                  const totalVotes = pollData.options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  const voters = pollData.votes.filter((v: any) => v.optionId === option.id).map((v: any) => v.voter);

                  return (
                    <div key={option.id} className="bg-[var(--surface-2)] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[var(--text)]">{option.title}</span>
                        <span className="text-[var(--text-muted)]">{option.votes} votes ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-[var(--bg)] rounded-full h-2 mb-2">
                        <div
                          className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {voters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {voters.map((voter: string, idx: number) => (
                            <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                              {voter}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            /* Show Voting Options */
            <div className="space-y-4">
              {pollData.options.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedOption === option.id
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface-2)]'
                  }`}
                >
                  <span className="font-medium text-[var(--text)]">{option.title}</span>
                </button>
              ))}

              <button
                onClick={handleVote}
                disabled={!selectedOption}
                className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Vote
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            Create your own poll
          </Link>
        </div>
      </div>
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </PageLayout>
  );
}
