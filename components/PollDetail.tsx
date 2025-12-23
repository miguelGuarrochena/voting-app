'use client';

import { useState } from 'react';
import { Poll, emojiOptions, defaultEmoji } from '@/types/poll';
import { formatDistanceToNow } from 'date-fns';

interface PollDetailProps {
  poll: Poll;
  onVote: (optionId: string) => void;
}

export default function PollDetail({ poll, onVote }: PollDetailProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    poll.userVotedOptionId || null
  );
  const [hasVoted, setHasVoted] = useState(!!poll.userVotedOptionId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async () => {
    if (!selectedOptionId || hasVoted) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onVote(selectedOptionId);
      setHasVoted(true);
    } catch (err) {
      setError('Failed to submit your vote. Please try again.');
      console.error('Voting error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const hasEnded = poll.isExpired || hasVoted;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold text-gray-900">{poll.question}</h1>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          poll.isExpired 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {poll.isExpired ? 'Poll ended' : `Ends ${formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}`}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Created by {poll.createdBy} • {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 
            ? Math.round((option.votes / totalVotes) * 100) 
            : 0;
          const isSelected = selectedOptionId === option.id;
          const showResults = hasEnded || hasVoted;
          
          return (
            <div key={option.id} className="space-y-1">
              <button
                type="button"
                disabled={poll.isExpired || hasVoted}
                onClick={() => !hasEnded && setSelectedOptionId(option.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  isSelected 
                    ? 'border-sky-500 bg-sky-50' 
                    : 'border-gray-200 hover:border-sky-300'
                } ${hasEnded ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{option.emoji || defaultEmoji}</span>
                    <span className="font-medium">{option.text}</span>
                  </div>
                  {showResults && (
                    <span className="text-sm font-medium text-gray-500">
                      {percentage}%
                    </span>
                  )}
                </div>
                
                {showResults && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-sky-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </button>
              
              {showResults && option.votes > 0 && (
                <p className="text-xs text-gray-500 pl-1">
                  {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!poll.isExpired && !hasVoted && (
        <button
          type="button"
          onClick={handleVote}
          disabled={!selectedOptionId || isSubmitting}
          className={`mt-6 w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            selectedOptionId && !isSubmitting
              ? 'bg-sky-600 hover:bg-sky-700'
              : 'bg-gray-300 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      )}

      {hasVoted && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          🎉 Thanks for voting! Your choice has been recorded.
        </div>
      )}
    </div>
  );
}
