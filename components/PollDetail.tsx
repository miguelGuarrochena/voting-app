'use client';

import { useState } from 'react';
import { Poll, defaultEmoji } from '@/types/poll';
import { formatDistanceToNow } from 'date-fns';

const EMOJI_REACTIONS = {
  positive: ['👍', '👏', '😍', '🔥'],
  negative: ['😐', '😡', '🍅', '🤮']
} as const;

interface PollDetailProps {
  poll: Poll;
  onVote: (optionId: string, emoji: string) => void;
}

interface SelectedReaction {
  optionId: string;
  emoji: string;
}

export default function PollDetail({ poll, onVote }: PollDetailProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleEmojiSelect = async (optionId: string, emoji: string) => {
    if (userReactions[optionId]) return; // Prevent multiple reactions to same option
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onVote(optionId, emoji);
      setUserReactions(prev => ({
        ...prev,
        [optionId]: emoji
      }));
    } catch (err) {
      setError('Failed to record your reaction. Please try again.');
      console.error('Reaction error:', err);
    } finally {
      setSelectedOption(null);
      setIsSubmitting(false);
    }
  };

  const toggleEmojiPicker = (optionId: string) => {
    if (userReactions[optionId]) return; // Don't show picker for already reacted options
    setSelectedOption(selectedOption === optionId ? null : optionId);
  };

  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
  const hasEnded = poll.isExpired;

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
          
          const isSelected = selectedOption === option.id;
          
          return (
            <div key={option.id} className="space-y-1">
              <div className="relative">
                <button
                  type="button"
                  disabled={poll.isExpired || !!userReactions[option.id]}
                  onClick={() => !poll.isExpired && toggleEmojiPicker(option.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50 scale-[1.02]'
                      : 'border-gray-200 hover:border-sky-300 hover:scale-[1.01]'
                  } ${
                    poll.isExpired || userReactions[option.id] 
                      ? 'cursor-default opacity-90' 
                      : 'cursor-pointer active:scale-95'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {userReactions[option.id] || (option.emoji || defaultEmoji)}
                      </span>
                      <span className="font-medium">{option.text}</span>
                    </div>
                    {userReactions[option.id] && (
                      <span className="text-sm font-medium text-gray-500">
                        You reacted with {userReactions[option.id]}
                      </span>
                    )}
                  </div>
                </button>

                {/* Emoji Picker */}
                {isSelected && !userReactions[option.id] && (
                  <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                    <div className="mb-2 text-xs text-gray-500 font-medium px-1">
                      React with...
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[...EMOJI_REACTIONS.positive, ...EMOJI_REACTIONS.negative].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmojiSelect(option.id, emoji);
                          }}
                          className="text-2xl p-2 hover:bg-gray-100 rounded-md transition-colors active:scale-95"
                          disabled={isSubmitting}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {isSubmitting && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm text-center">
          Recording your reaction...
        </div>
      )}
    </div>
  );
}
