'use client';

import { memo, useMemo, useCallback } from 'react';
import { Poll, getTopReaction, isPositiveReaction, ReactionType } from '@/types/poll';
import usePollStore from '@/store/pollStore';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Define the reaction emojis as an array of ReactionType
const REACTION_EMOJIS: ReactionType[] = ['👏', '😄', '❤️', '🔥', '😡', '🤮', '🍅', '😈'];

interface PollCardProps {
  poll: Poll;
  index?: number;
}

const PollCard = memo(function PollCard({ poll, index = 0 }: PollCardProps) {
  // Memoize derived state to prevent unnecessary recalculations
  const { isExpired, timeRemaining } = useMemo(() => {
    const now = new Date();
    const expiryDate = new Date(poll.expiresAt);
    return {
      isExpired: expiryDate < now,
      timeRemaining: formatDistanceToNow(expiryDate, { addSuffix: true })
    };
  }, [poll.expiresAt]);

  // Select only the necessary values from the store
  const reactToOption = usePollStore((state) => state.reactToOption);
  const userReactionsForPoll = usePollStore(
    (state) => state.userReactions[poll.id]
  );
  const userReactions = userReactionsForPoll || useMemo(() => ({}), []);
  
  // Memoize the handleReaction function with stable references
  const handleReaction = useCallback((optionId: string, emoji: ReactionType) => {
    reactToOption(poll.id, optionId, emoji);
  }, [poll.id, reactToOption]);
  
  // Memoize vote calculations
  const { totalVotes, hasVotes } = useMemo(() => {
    const getOptionVotes = (option: Poll['options'][number]) => {
      return Object.values(option.reactions).reduce((sum: number, count: number) => sum + count, 0);
    };
    
    const votes = poll.options.reduce((sum, option) => sum + getOptionVotes(option), 0);
    return {
      totalVotes: votes,
      hasVotes: votes > 0
    };
  }, [poll.options]);
  
  // Memoize the options to show to prevent unnecessary re-renders
  const optionsToShow = useMemo(() => poll.options.slice(0, 3), [poll.options]);

  // Memoize the renderReactionButton function with stable references
  const renderReactionButton = useCallback((emoji: ReactionType, optionId: string) => {
    const isActive = userReactions[optionId] === emoji;
    return (
      <button
        key={emoji}
        onClick={() => handleReaction(optionId, emoji)}
        className={`text-xl p-1 rounded-full transition-colors ${
          isActive 
            ? isPositiveReaction(emoji) 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
            : 'hover:bg-gray-100'
        }`}
        aria-label={`React with ${emoji}`}
      >
        {emoji}
      </button>
    );
  }, [handleReaction, userReactions]);

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.1 }}
      layoutId={`poll-${poll.id}`}
    >
      {/* Poll image (use first option's image if available) */}
      {poll.options[0]?.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={poll.options[0].imageUrl}
            alt={poll.options[0].title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index !== undefined && index < 3}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{poll.title}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
            isExpired 
              ? 'bg-red-100 text-red-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isExpired ? 'Ended' : `Ends ${timeRemaining}`}
          </span>
        </div>
        
        {poll.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {poll.description}
          </p>
        )}
        
        <div className="space-y-3 mt-4">
          {optionsToShow.map((option) => {
            const optionVotes = Object.values(option.reactions).reduce(
              (sum: number, count: number) => sum + count, 
              0
            );
            const percentage = hasVotes ? Math.round((optionVotes / totalVotes) * 100) : 0;
            const topReaction = getTopReaction(option.reactions);
            
            return (
              <div key={option.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900 truncate pr-2">
                    {option.title}
                  </span>
                  {topReaction && (
                    <span className="flex-shrink-0 text-sm font-medium text-gray-500">
                      {topReaction.emoji} {topReaction.count}
                    </span>
                  )}
                </div>
                
                <div className="w-full bg-gray-100 rounded-full h-2">
                  {hasVotes && (
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" 
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                </div>
                
                {!isExpired && (
                  <div className="flex space-x-1 pt-1 overflow-x-auto pb-2 -mx-1 px-1">
                    {REACTION_EMOJIS.map((emoji) => renderReactionButton(emoji, option.id))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
          <span>{poll.totalReactions} reactions</span>
          
          <Link 
            href={`/polls/${poll.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            View details
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

export { PollCard };
