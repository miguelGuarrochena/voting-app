'use client';

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Poll, getPositiveVotes, ALL_SUPPORTED_REACTIONS } from '@/types/poll';
import { usePollInteractions } from '@/hooks/useApi';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getCreatorAvatar } from '@/data/mockPolls';
import { ImageGallery } from './ImageGallery';

// Define the reaction emojis
const REACTION_EMOJIS = ALL_SUPPORTED_REACTIONS;

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
  className?: string;
}

export const PollCard = memo(({ poll, compact = false, className = "" }: PollCardProps) => {
  const { handleVote, handleReaction, hasVoted, votedOption, userReactions, isInteracting } = usePollInteractions(poll.id);
  const [mounted, setMounted] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({});
  const [imageError, setImageError] = useState(false);
  const [optionImageErrors, setOptionImageErrors] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get main image
  const mainImage = poll.options[0]?.imageUrl;
  
  // Memoize calculations
  const { isExpired, timeRemaining, totalVotes, hasVotes } = useMemo(() => {
    const now = new Date();
    const expiryDate = new Date(poll.expiresAt);
    const votes = poll.options.reduce((sum: number, option: any) => sum + getPositiveVotes(option.reactions), 0);
    
    return {
      isExpired: expiryDate < now,
      timeRemaining: formatDistanceToNow(expiryDate, { addSuffix: true }),
      totalVotes: votes,
      hasVotes: votes > 0
    };
  }, [poll.expiresAt, poll.options]);

  // Get all images for gallery
  const getGalleryImages = useCallback(() => {
    const images: { url: string; title: string }[] = [];
    
    if (mainImage) {
      images.push({
        url: mainImage,
        title: poll.title
      });
    }
    
    poll.options.forEach((option) => {
      if (option.imageUrl) {
        images.push({
          url: option.imageUrl,
          title: option.title
        });
      }
    });
    
    return images;
  }, [mainImage, poll.title, poll.options]);

  // Handle image click
  const handleImageClick = useCallback((imageIndex: number) => {
    setGalleryInitialIndex(imageIndex);
    setIsGalleryOpen(true);
  }, []);
  
  // Animate progress bars on mount
  useEffect(() => {
    if (!hasVotes) return;
    
    const percentages: Record<string, number> = {};
    poll.options.forEach((option: any) => {
      percentages[option.id] = 0;
    });
    
    setAnimatedPercentages(percentages);
    
    const timer = setTimeout(() => {
      const finalPercentages: Record<string, number> = {};
      poll.options.forEach((option: any) => {
        const percentage = totalVotes > 0 ? Math.round((getPositiveVotes(option.reactions) / totalVotes) * 100) : 0;
        finalPercentages[option.id] = percentage;
      });
      setAnimatedPercentages(finalPercentages);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [poll.options, totalVotes, hasVotes]);
  
  // Get gradient for no-image fallback
  const getGradient = useCallback((title: string) => {
    const index = title.charCodeAt(0) % GRADIENTS.length;
    return GRADIENTS[index];
  }, []);
  
  // Get top 3 reactions for an option
  const getTopReactions = useCallback((reactions: Record<string, number>) => {
    return Object.entries(reactions)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);
  }, []);

  const handleVoteClick = useCallback(async (optionId: string) => {
    if (isExpired || hasVoted) return;
    try {
      await handleVote(optionId);
    } catch (error) {
      console.error('Vote failed:', error);
    }
  }, [isExpired, hasVoted, handleVote]);

  const handleReactionClick = useCallback(async (optionId: string, emoji: string) => {
    if (isExpired) return;
    try {
      await handleReaction(optionId, emoji);
    } catch (error) {
      console.error('Reaction failed:', error);
    }
  }, [isExpired, handleReaction]);

  const cardHeight = compact ? 'h-[480px] sm:h-[520px]' : 'h-[580px] sm:h-[620px]';
  
  return (
    <div className={`block ${className}`}>
      <motion.div 
        className={`${cardHeight} bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-border hover:-translate-y-1 active:scale-[0.98] flex flex-col cursor-pointer overflow-hidden group`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => window.location.href = `/polls/${poll.id}`}
      >
        {/* Image Section */}
        <div className="relative h-48 sm:h-52 flex-shrink-0 rounded-t-3xl overflow-hidden">
          {mainImage && !imageError ? (
            <>
              <div 
                className="relative w-full h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(0);
                }}
              >
                <Image
                  src={mainImage}
                  alt={poll.options[0]?.title || poll.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0h3m-3 0h3" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${
                  isExpired 
                    ? 'bg-gray-500/80 text-white' 
                    : 'bg-green-500/80 text-white'
                }`}>
                  {!isExpired && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                  {isExpired ? 'Ended' : 'Active'}
                </div>
              </div>
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center relative"
              style={{ background: getGradient(poll.title) }}
            >
              {/* Avatar Circle */}
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {poll.title.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${
                  isExpired 
                    ? 'bg-gray-500/80 text-white' 
                    : 'bg-green-500/80 text-white'
                }`}>
                  {!isExpired && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                  {isExpired ? 'Ended' : 'Active'}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Title and Meta */}
          <div className="p-5 sm:p-6 flex-shrink-0">
            <h3 className="font-display font-bold text-text text-xl sm:text-2xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
              {poll.title}
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center text-primary text-sm font-medium">
                  {getCreatorAvatar(poll.createdBy)}
                </div>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{mounted ? formatDistanceToNow(poll.createdAt, { addSuffix: true }) : 'loading'}</span>
              </div>
              
              <div className="text-sm font-medium text-primary">
                {totalVotes} votes
              </div>
            </div>

            {poll.description && (
              <p className="text-text-muted text-sm line-clamp-2 mb-4">
                {poll.description}
              </p>
            )}
          </div>
          
          {/* Options */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4">
            <div className="space-y-3">
              {poll.options.slice(0, compact ? 3 : undefined).map((option: any, index: any) => {
                const percentage = totalVotes > 0 ? Math.min(Math.round((getPositiveVotes(option.reactions) / totalVotes) * 100), 100) : 0;
                const animatedPercentage = animatedPercentages[option.id] || 0;
                const topReactions = getTopReactions(option.reactions);
                const hasVotedForOption = votedOption === option.id;
                const userReaction = userReactions[option.id];
                
                return (
                  <div
                    key={option.id}
                    className={`relative group transition-all rounded-2xl overflow-hidden ${
                      !isExpired && !hasVoted ? 'hover:bg-surface-2 cursor-pointer' : ''
                    } ${hasVotedForOption ? 'border-2 border-primary bg-primary/5' : 'bg-surface'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoteClick(option.id);
                    }}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {option.imageUrl && !optionImageErrors[option.id] ? (
                            <Image
                              src={option.imageUrl}
                              alt={option.title}
                              width={24}
                              height={24}
                              className="rounded-lg object-cover flex-shrink-0"
                              onError={() => setOptionImageErrors(prev => ({ ...prev, [option.id]: true }))}
                            />
                          ) : (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-surface-2 flex items-center justify-center text-xs sm:text-sm font-medium text-text-muted flex-shrink-0">
                              {option.title.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-sm sm:text-base text-text truncate">
                            {option.title}
                          </span>
                          {hasVotedForOption && (
                            <span className="text-primary text-sm sm:text-base">✓</span>
                          )}
                        </div>
                        <span className="text-sm sm:text-base font-bold text-primary ml-2">
                          {percentage}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: percentage / 100 }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          style={{ transformOrigin: 'left' }}
                        />
                      </div>
                      
                      {/* Reaction Pills */}
                      {topReactions.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {topReactions.map(([emoji, count]) => (
                            <button
                              key={emoji}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                userReaction === emoji
                                  ? 'bg-primary text-white'
                                  : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactionClick(option.id, emoji);
                              }}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {compact && poll.options.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-sm text-text-muted">
                    +{poll.options.length - 3} more options
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-t border-border flex-shrink-0 bg-surface/50">
            <div className="text-sm text-text-muted">
              {mounted ? timeRemaining.replace('in ', '') : 'loading'}
            </div>
            
            <span className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
              View details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
        
        {/* Image Gallery Modal */}
        <ImageGallery
          images={getGalleryImages()}
          initialIndex={galleryInitialIndex}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
        />
      </motion.div>
    </div>
  );
});

PollCard.displayName = 'PollCard';
