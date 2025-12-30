'use client';

import { Poll, getTopReaction, getTotalReactions, isPositiveReaction, ReactionType } from '../src/types/poll';
import usePollStore from '../store/pollStore';
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

export default function PollCard({ poll, index = 0 }: PollCardProps) {
  const reactToOption = usePollStore(state => state.reactToOption);
  const userReactions = usePollStore(state => state.userReactions[poll.id] || {});
  
  const isExpired = new Date(poll.expiresAt) < new Date();
  const timeRemaining = formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true });
  
  const handleReaction = (optionId: string, emoji: ReactionType) => {
    reactToOption(poll.id, optionId, emoji);
  };
  
  // Helper function to render reaction buttons
  const renderReactionButton = (emoji: ReactionType, optionId: string) => {
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
  };
  
  const getOptionVotes = (option: Poll['options'][0]) => {
    return Object.values(option.reactions).reduce((sum, count) => sum + count, 0);
  };
  
  const totalVotes = poll.options.reduce((sum, option) => sum + getOptionVotes(option), 0);
  const hasVotes = totalVotes > 0;
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Poll image (use first option's image if available) */}
      {poll.options[0]?.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={poll.options[0].imageUrl}
            alt={poll.options[0].title}
            fill
            className="object-cover"
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
          {poll.options.slice(0, 3).map((option) => {
            const optionVotes = getOptionVotes(option);
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
                
                {hasVotes && (
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
                
                {!isExpired && (
                  <div className="flex space-x-1 pt-1 overflow-x-auto pb-2 -mx-1 px-1">
                    {REACTION_EMOJIS.map((emoji) => {
                      const isActive = userReactions[option.id] === emoji;
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(option.id, emoji)}
                          className={`p-1.5 rounded-full transition-all ${
                            isActive 
                              ? 'bg-blue-100 scale-110' 
                              : 'hover:bg-gray-100 hover:scale-105'
                          }`}
                          aria-label={`React with ${emoji}`}
                        >
                          <span className={`text-lg ${isActive ? 'scale-125' : ''}`}>
                            {emoji}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          
          {poll.options.length > 3 && (
            <div className="text-sm text-center text-gray-500 pt-2">
              +{poll.options.length - 3} more options
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {poll.options.slice(0, 3).map(option => {
                const topReaction = getTopReaction(option.reactions);
                return topReaction ? (
                  <div 
                    key={option.id}
                    className="w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs"
                    title={`${option.title}: ${topReaction.emoji} ${topReaction.count}`}
                  >
                    {topReaction.emoji}
                  </div>
                ) : null;
              })}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </span>
          </div>
          
          <Link 
            href={`/polls/${poll.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            View poll
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
