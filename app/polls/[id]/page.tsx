'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PollDetail from '@/components/PollDetail';
import { Poll } from '@/types/poll';

export default function PollPage() {
  const { id } = useParams();
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In a real app, you would fetch the poll data from an API
    const fetchPoll = async () => {
      try {
        // Mock data for demonstration
        const mockPoll: Poll = {
          id: id as string,
          question: 'What\'s your favorite programming language?',
          options: [
            { id: '1', text: 'TypeScript', votes: 42, emoji: '💙' },
            { id: '2', text: 'Python', votes: 35, emoji: '🐍' },
            { id: '3', text: 'JavaScript', votes: 28, emoji: '✨' },
            { id: '4', text: 'Rust', votes: 15, emoji: '🦀' },
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
          isExpired: false,
          totalVotes: 120,
          createdBy: 'devuser',
        };
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPoll({
          ...mockPoll,
          // Randomly set if the current user has voted
          userVotedOptionId: Math.random() > 0.5 ? '1' : undefined,
        });
      } catch (err) {
        console.error('Failed to load poll:', err);
        setError('Failed to load the poll. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [id]);

  const handleVote = async (optionId: string) => {
    if (!poll) return;
    
    try {
      // In a real app, you would submit the vote to an API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the local state to reflect the vote
      setPoll({
        ...poll,
        options: poll.options.map(option => 
          option.id === optionId 
            ? { ...option, votes: option.votes + 1 }
            : option
        ),
        totalVotes: poll.totalVotes + 1,
        userVotedOptionId: optionId,
      });
    } catch (err) {
      console.error('Voting failed:', err);
      throw new Error('Failed to submit your vote');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Poll not found'}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/')}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-sm text-sky-600 hover:text-sky-800"
      >
        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to polls
      </button>
      
      <PollDetail 
        poll={poll} 
        onVote={handleVote} 
      />
    </div>
  );
}
