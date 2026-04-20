'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { isExpired, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { getPoll, submitResponse, getPollResponses } from '@/lib/db';
import { PageLayout } from '@/components/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import Link from 'next/link';
import { Share2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function RankingTokenPage() {
  const params = useParams();
  const { username } = useUsername();
  const token = params.token as string;
  const [pollData, setPollData] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<string[]>([]);
  const [hasVotedState, setHasVotedState] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  useEffect(() => {
    const loadRanking = async () => {
      // Show toast if just created
      if (justCreated) {
        toast('¡Ranking creado con éxito! 🎉');
        // Remove the query param from URL without triggering a reload
        window.history.replaceState({}, '', `/ranking/${token}`);
      }

      // Load poll data from Supabase
      const data = await getPoll(token);
      if (!data) {
        setError('Ranking not found');
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

    loadRanking();

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

        // Recalculate ranking scores
        const rankingScores: Record<string, number> = {};
        responses.forEach(response => {
          const rankings = response.response.rankings || [];
          rankings.forEach((optionId: string, index: number) => {
            rankingScores[optionId] = (rankingScores[optionId] || 0) + (rankings.length - index);
          });
        });

        // Update poll options with new ranking scores
        setPollData((prev: any) => ({
          ...prev,
          options: prev.options.map((opt: any) => ({
            ...opt,
            rankingScore: rankingScores[opt.id] || 0
          })),
          rankings: responses.map(r => ({ rankings: r.response.rankings, voter: r.username, timestamp: r.created_at }))
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, username]);

  useEffect(() => {
    if (pollData && !hasVotedState) {
      // Initialize rankings with option IDs in their original order
      setRankings(pollData.options.map((opt: any) => opt.id));
    }
  }, [pollData, hasVotedState]);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newRankings = [...rankings];
    const item = newRankings[draggedItem];
    newRankings.splice(draggedItem, 1);
    newRankings.splice(index, 0, item);
    setRankings(newRankings);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSubmitRanking = async () => {
    if (!pollData) return;

    // Submit response to Supabase
    const success = await submitResponse(token, username || 'Anonymous', { rankings });
    
    if (!success) {
      toast.error('Error al enviar tu ranking');
      return;
    }

    setHasVotedState(true);
    toast('¡Ranking enviado! 🎉');

    // Reload responses to get updated ranking scores
    const newResponses = await getPollResponses(token);
    setResponses(newResponses);

    // Calculate ranking scores from responses
    const rankingScores: Record<string, number> = {};
    newResponses.forEach(response => {
      const responseRankings = response.response.rankings || [];
      responseRankings.forEach((optionId: string, index: number) => {
        rankingScores[optionId] = (rankingScores[optionId] || 0) + (responseRankings.length - index);
      });
    });

    // Update poll data with new ranking scores
    const updatedOptions = pollData.options.map((opt: any) => ({
      ...opt,
      rankingScore: rankingScores[opt.id] || 0,
    }));

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      rankings: newResponses.map(r => ({ rankings: r.response.rankings, voter: r.username, timestamp: r.created_at })),
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
            <Link
              href="/ranking"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Ranking not found</h2>
            <p className="text-[var(--text-muted)] mb-6">This ranking may have been deleted or the link is invalid.</p>
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
              href="/ranking"
              className="hidden sm:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            </Link>
          </div>
          <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">¡Se acabó el tiempo! 🎉</h2>
            <p className="text-[var(--text-muted)] mb-6">This ranking has expired. Here are the final results:</p>

            {/* Results */}
            <div className="space-y-2 mb-6">
              {pollData.options
                .sort((a: any, b: any) => (b.rankingScore || 0) - (a.rankingScore || 0))
                .map((option: any, index: number) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-4 bg-[var(--surface-2)] rounded-lg p-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[var(--text)] flex-1">{option.title}</span>
                    <span className="text-[var(--text-muted)]">{option.rankingScore || 0} pts</span>
                  </div>
                ))}
            </div>
            {responses.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-[var(--text-muted)] mb-2">Participants:</p>
                <div className="flex flex-wrap gap-1">
                  {responses.map((r: any, idx: number) => (
                    <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                      {r.username}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link href="/" className="text-[var(--primary)] hover:underline">
                Create your own ranking
              </Link>
            </div>
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
              href="/ranking"
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

        {/* Ranking Card */}
        <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8">
          {pollData.description && (
            <p className="text-[var(--text-muted)] mb-6">{pollData.description}</p>
          )}

          {hasVotedState ? (
            /* Show Results */
            <div className="space-y-2">
              <p className="text-[var(--text-muted)] mb-4">You have already ranked. Here are the current results:</p>
              {pollData.options
                .sort((a: any, b: any) => (b.rankingScore || 0) - (a.rankingScore || 0))
                .map((option: any, index: number) => {
                  const rankers = responses.filter((r: any) => r.response.rankings?.includes(option.id)).map((r: any) => r.username) || [];

                  return (
                    <div
                      key={option.id}
                      className="flex items-center gap-4 bg-[var(--surface-2)] rounded-lg p-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-[var(--text)] flex-1">{option.title}</span>
                      <span className="text-[var(--text-muted)]">{option.rankingScore || 0} pts</span>
                    </div>
                  );
                })}
              {responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] mb-2">Participants:</p>
                  <div className="flex flex-wrap gap-1">
                    {responses.map((r: any, idx: number) => (
                      <span key={idx} className="text-xs bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] px-2 py-1 rounded-full text-[var(--primary)]">
                        {r.username}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Show Ranking Interface */
            <div className="space-y-2">
              <p className="text-[var(--text-muted)] mb-4">Drag and drop to rank these options (1 is best):</p>
              {rankings.map((optionId, index) => {
                const option = pollData.options.find((opt: any) => opt.id === optionId);
                if (!option) return null;

                return (
                  <div
                    key={option.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 bg-[var(--surface-2)] rounded-lg p-4 cursor-move transition-all ${
                      draggedItem === index ? 'opacity-50' : 'hover:bg-[var(--surface)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-[var(--text)] flex-1">{option.title}</span>
                    <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                );
              })}

              <button
                onClick={handleSubmitRanking}
                className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors mt-6"
              >
                Submit Ranking
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            Create your own ranking
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
