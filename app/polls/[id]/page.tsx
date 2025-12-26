'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import PollDetail from '../../../components/PollDetail';
import { usePollStore } from '../../../src/store/usePollStore';
import { mapStorePollToUIPoll } from '../../../src/types/poll';

export default function PollPage() {
  const { id: pollId } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get the poll from the store
  const storePoll = usePollStore((state) => 
    state.polls.find((p) => p.id === pollId)
  );
  const voteOnOption = usePollStore((state) => state.voteOnOption);
  
  // Map the store poll to UI poll
  const poll = storePoll ? mapStorePollToUIPoll(storePoll) : null;
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!storePoll) {
        setError('Poll not found');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [storePoll]);
  
  const handleVote = async (optionId: string, emoji: string) => {
    if (!pollId || typeof pollId !== 'string') return;
    
    try {
      voteOnOption(pollId, optionId, emoji);
    } catch (err) {
      console.error('Failed to vote:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Poll not found'}</p>
              <div className="mt-2">
                <button
                  onClick={() => router.push('/')}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  ← Back to all polls
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{poll.question}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Created by {poll.author.name} • {poll.totalVotes} votes • 
              <span className={`ml-1 ${poll.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {poll.isExpired ? 'Ended' : `Ends ${formatDistanceToNow(poll.expiresAt, { addSuffix: true })}`}
              </span>
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-8">
          <PollDetail 
            poll={poll} 
            onVote={handleVote} 
          />
        </div>
      </div>
    </div>
  );
}
