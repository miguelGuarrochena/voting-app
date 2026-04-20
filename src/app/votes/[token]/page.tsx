'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { isExpired, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses } from '@/lib/db';
import { PageLayout } from '@/components/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Share2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function VoteTokenPage() {
  const router = useRouter();
  const params = useParams();
  const { username } = useUsername();
  const token = params.token as string;
  const [pollData, setPollData] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  useEffect(() => {
    const loadPoll = async () => {
      // Show toast if just created
      if (justCreated) {
        toast('¡Voto creado con éxito! 🎉');
        // Remove the query param from URL without triggering a reload
        window.history.replaceState({}, '', `/votes/${token}`);
      }

      // Load poll data from Supabase
      const data = await getPoll(token);
      if (!data) {
        setError('Poll not found');
        setLoading(false);
        return;
      }

      setPollData(data);
      setExpired(isExpired(new Date(data.expiresAt)));
      setTimeRemaining(getTimeRemaining(new Date(data.expiresAt)));
      setLoading(false);

      // Load responses to check if user has voted
      const responses = await getPollResponses(token);
      setResponses(responses);
      const userResponse = responses.find(r => r.username === username);
      setHasVotedState(!!userResponse);

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
    };

    loadPoll();

    // Set up Realtime subscription
    const channel = supabase
      .channel('poll-responses')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'poll_responses',
        filter: `poll_token=eq.${token}`
      }, async (payload) => {
        // Reload responses when new response comes in
        const responses = await getPollResponses(token);
        setResponses(responses);
        const userResponse = responses.find(r => r.username === username);
        setHasVotedState(!!userResponse);

        // Recalculate vote counts
        const voteCounts: Record<string, number> = {};
        responses.forEach(response => {
          const optionId = response.response.optionId;
          voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
        });

        // Update poll options with new vote counts
        setPollData((prev: any) => ({
          ...prev,
          options: prev.options.map((opt: any) => ({
            ...opt,
            votes: voteCounts[opt.id] || 0
          })),
          votes: responses.map(r => ({ optionId: r.response.optionId, voter: r.username, timestamp: r.created_at }))
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  const handleVote = async () => {
    if (!selectedOption || !pollData) return;

    // Submit response to Supabase
    const success = await submitResponse(token, username || 'Anonymous', { optionId: selectedOption });
    
    if (!success) {
      toast.error('Error al enviar tu voto');
      return;
    }

    setHasVotedState(true);
    toast('¡Voto enviado! 🎉');

    // Reload responses to get updated vote counts
    const newResponses = await getPollResponses(token);
    setResponses(newResponses);

    // Calculate vote counts from responses
    const voteCounts: Record<string, number> = {};
    const votersByOption: Record<string, string[]> = {};

    newResponses.forEach(response => {
      const optionId = response.response.optionId;
      voteCounts[optionId] = (voteCounts[optionId] || 0) + 1;
      if (!votersByOption[optionId]) {
        votersByOption[optionId] = [];
      }
      votersByOption[optionId].push(response.username);
    });

    // Update poll data with new vote counts
    const updatedOptions = pollData.options.map((opt: any) => ({
      ...opt,
      votes: voteCounts[opt.id] || 0
    }));

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      votes: newResponses.map(r => ({ optionId: r.response.optionId, voter: r.username, timestamp: r.created_at })),
    };

    setPollData(updatedPollData);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast('¡Link copiado! 🎉');
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
            <button
              onClick={() => router.back()}
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
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
            <button
              onClick={() => router.back()}
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
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
                  const voters = responses.filter((r: any) => r.response.optionId === option.id).map((r: any) => r.username);

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
            <button
              onClick={() => router.back()}
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
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
                  const voters = responses.filter((r: any) => r.response.optionId === option.id).map((r: any) => r.username);

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
    </PageLayout>
  );
}
