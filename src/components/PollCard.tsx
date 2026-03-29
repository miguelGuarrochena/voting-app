'use client';

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Poll, ReactionType } from '@/types/poll';
import usePollStore from '@/store/pollStore';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getCreatorAvatar } from '@/data/mockPolls';

// Define the reaction emojis
const REACTION_EMOJIS: ReactionType[] = ['👏', '😄', '❤️', '🔥', '😡', '🤮', '🍅', '😈'];

// Warm gradients for no-image fallbacks
const GRADIENTS = [
  'linear-gradient(135deg, #FF6B6B, #FFE66D)',
  'linear-gradient(135deg, #4ECDC4, #44A08D)',
  'linear-gradient(135deg, #45B7D1, #2196F3)',
  'linear-gradient(135deg, #F7DC6F, #F39C12)',
  'linear-gradient(135deg, #BB8FCE, #8E44AD)',
  'linear-gradient(135deg, #85C1E2, #3498DB)',
];

interface PollCardProps {
  poll: Poll;
  compact?: boolean;
}

const PollCard = memo(function PollCard({ poll, compact = false }: PollCardProps) {
  const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({});
  
  // Store hooks
  const voteOnOption = usePollStore((state) => state.voteOnOption);
  const userVotes = usePollStore((state) => state.userVotes);
  const reactToOption = usePollStore((state) => state.reactToOption);
  const userReactionsStore = usePollStore((state) => state.userReactions);
  
  // Memoize userReactions to prevent infinite re-renders
  const userReactions = useMemo(() => userReactionsStore[poll.id] || {}, [userReactionsStore, poll.id]);
  
  // Memoize calculations
  const { isExpired, timeRemaining, totalVotes, hasVotes } = useMemo(() => {
    const now = new Date();
    const expiryDate = new Date(poll.expiresAt);
    const votes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
    
    return {
      isExpired: expiryDate < now,
      timeRemaining: formatDistanceToNow(expiryDate, { addSuffix: true }),
      totalVotes: votes,
      hasVotes: votes > 0
    };
  }, [poll.expiresAt, poll.options]);
  
  // Animate progress bars on mount
  useEffect(() => {
    if (!hasVotes) return;
    
    const percentages: Record<string, number> = {};
    poll.options.forEach((option) => {
      const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
      percentages[option.id] = 0;
      
      // Animate to actual percentage
      setTimeout(() => {
        setAnimatedPercentages(prev => ({ ...prev, [option.id]: percentage }));
      }, 100);
    });
    
    setAnimatedPercentages(percentages);
  }, [poll.options, totalVotes, hasVotes]);
  
  // Handle voting
  const handleVote = useCallback((optionId: string) => {
    if (isExpired) return;
    if (userVotes[poll.id]) return; // Already voted
    
    voteOnOption(poll.id, optionId);
  }, [poll.id, isExpired, userVotes, voteOnOption]);
  
  // Get gradient for no-image fallback
  const getGradient = useCallback((title: string) => {
    const index = title.charCodeAt(0) % GRADIENTS.length;
    return GRADIENTS[index];
  }, []);
  
  // Get top 3 reactions for an option
  const getTopReactions = useCallback((reactions: Record<ReactionType, number>) => {
    return Object.entries(reactions)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);
  }, []);
  
  const userVotedOption = userVotes[poll.id];
  const mainImage = poll.options[0]?.imageUrl;
  const isCompact = compact;
  
  return (
    <motion.div 
      className={`${isCompact ? 'w-[280px] h-[360px]' : 'w-full h-full'} bg-white rounded-[24px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 overflow-hidden border border-[var(--border)] @media(hover:hover):hover:-translate-y-1 active:scale-[0.98] flex flex-col`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Image Section - Fixed 200px height */}
      <div className="relative h-[200px] flex-shrink-0">
        {mainImage ? (
          <>
            <Image
              src={mainImage}
              alt={poll.options[0]?.title || poll.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ background: getGradient(poll.title) }}
          >
            <span className="text-6xl font-bold text-white/80">
              {poll.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Title on Image */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-display text-white font-semibold text-base line-clamp-2">
            {poll.title}
          </h3>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Creator Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-xs font-medium">
              {getCreatorAvatar(poll.createdBy)}
            </div>
            <span className="text-sm text-[var(--text-muted)]">
              {poll.createdBy} · {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {/* Status Badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isExpired 
              ? 'bg-gray-100 text-gray-600' 
              : 'bg-green-100 text-green-700'
          }`}>
            {!isExpired && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            {isExpired ? 'Ended' : 'Active'}
          </div>
        </div>
        
        {/* Options - Fixed min-height */}
        <div className={`space-y-3 ${isCompact ? 'min-h-[120px]' : 'min-h-[180px]'} flex-1`}>
          {poll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
            const animatedPercentage = animatedPercentages[option.id] || 0;
            const topReactions = getTopReactions(option.reactions);
            const hasVoted = userVotedOption === option.id;
            
            return (
              <div
                key={option.id}
                className={`cursor-pointer transition-all ${
                  !isExpired && !userVotedOption ? 'hover:bg-[var(--surface)] rounded-lg p-2 -m-2' : ''
                } ${hasVoted ? 'border-2 border-[var(--primary)] rounded-lg p-2 -m-2' : ''}`}
                onClick={() => handleVote(option.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {option.imageUrl && (
                      <Image
                        src={option.imageUrl}
                        alt={option.title}
                        width={24}
                        height={24}
                        className="rounded object-cover"
                      />
                    )}
                    <span className="font-medium text-sm text-[var(--text)]">
                      {option.title}
                    </span>
                    {hasVoted && (
                      <span className="text-[var(--primary)] text-sm">✓</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[var(--text)]">
                    {percentage}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-[var(--surface-2)] rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className="bg-[var(--primary)] h-2 rounded-full transition-all duration-800 ease-out"
                    style={{ 
                      width: `${animatedPercentage}%`,
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>
                
                {/* Reaction Pills */}
                {topReactions.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {topReactions.map(([emoji, count]) => (
                      <div
                        key={emoji}
                        className="bg-[var(--primary-light)] text-[var(--primary)] text-xs px-2 py-0.5 rounded-full"
                      >
                        {emoji} {count}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Footer - Pinned to bottom */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
          <div className="text-sm text-[var(--text-muted)]">
            {totalVotes} votes · {timeRemaining.replace('in ', '')}
          </div>
          
          <Link
            href={`/polls/${poll.id}`}
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-1"
          >
            View →
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

export { PollCard };
