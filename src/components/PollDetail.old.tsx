'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import usePollStore from '@/store/pollStore';

const EMOJI_REACTIONS = {
  positive: ['👍', '❤️', '😂', '😮', '😢', '🙌'],
  negative: ['👎', '😡', '🤔']
} as const;

type PollDetailProps = {
  pollId: string;
};

const PollDetail = ({ pollId }: PollDetailProps) => {
  const { reactToOption, getPollById } = usePollStore();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  
  // Get the poll from the store
  const poll = getPollById(pollId);
  
  if (!poll) {
    return <div className="text-center py-8">Poll not found</div>;
  }
  
  // Calculate total votes and check if poll has ended
  const totalVotes = poll.options.reduce((sum: number, option) => {
    const optionVotes = Object.values(option.reactions).reduce(
      (a: number, b: number) => a + b, 
      0
    );
    return sum + optionVotes;
  }, 0);
  
  const hasEnded = new Date(poll.expiresAt) < new Date();
  
  // Helper function to get votes for an option
  const getOptionVotes = (optionId: string): number => {
    const option = poll.options.find((o: { id: string }) => o.id === optionId);
    if (!option) return 0;
    return Object.values(option.reactions).reduce(
      (a: number, b: number) => a + b, 
      0
    );
  };

  const handleEmojiSelect = (optionId: string, emoji: string) => {
    if (userReactions[optionId]) return; // Prevent multiple reactions to same option
    
    try {
      // Update the store
      reactToOption(pollId, optionId, emoji as any);
      
      // Update local UI state
      setUserReactions(prev => ({
        ...prev,
        [optionId]: emoji
      }));
      
      // Close the emoji picker
      setSelectedOption(null);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const toggleEmojiPicker = (optionId: string) => {
    if (userReactions[optionId]) return; // Don't show picker for already reacted options
    setSelectedOption(selectedOption === optionId ? null : optionId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
        {poll.description && (
          <p className="mt-2 text-gray-600">{poll.description}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Created by {poll.createdBy} • {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
        </p>
        {hasEnded && (
          <div className="mt-2 text-sm font-medium text-red-600">
            This poll has ended
          </div>
        )}
      </div>

      <div className="space-y-4">
        {poll.options.map((option) => {
          const optionVotes = getOptionVotes(option.id);
          const percentage = totalVotes > 0 
            ? Math.round((optionVotes / totalVotes) * 100) 
            : 0;
          const hasReacted = !!userReactions[option.id];
          const isSelected = selectedOption === option.id;

          return (
            <div key={option.id} className="relative">
              <div 
                className={`relative p-4 border rounded-lg transition-all ${
                  hasReacted 
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {optionVotes} {optionVotes === 1 ? 'vote' : 'votes'} • {percentage}%
                    </p>
                    
                    {option.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <img 
                          src={option.imageUrl} 
                          alt={option.title} 
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-sky-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{optionVotes} {optionVotes === 1 ? 'vote' : 'votes'}</span>
                  
                  {!hasEnded && !hasReacted && (
                    <button
                      type="button"
                      onClick={() => toggleEmojiPicker(option.id)}
                      className="text-sky-600 hover:text-sky-800 font-medium"
                    >
                      {isSelected ? 'Cancel' : 'React'}
                    </button>
                  )}
                  
                  {hasReacted && (
                    <span className="text-sky-600 font-medium">
                      You reacted with {userReactions[option.id]}
                    </span>
                  )}
                </div>

                {isSelected && !hasReacted && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Choose a reaction:</p>
                    <div className="flex flex-wrap gap-2">
                      {[...EMOJI_REACTIONS.positive, ...EMOJI_REACTIONS.negative].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(option.id, emoji)}
                          className="text-2xl hover:scale-125 transform transition-transform"
                          aria-label={`React with ${emoji}`}
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
    </div>
  );
};

export default PollDetail;
