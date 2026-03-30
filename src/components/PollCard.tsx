'use client';

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Poll, getPositiveVotes, ALL_SUPPORTED_REACTIONS } from '@/types/poll';
import usePollStore from '@/store/pollStore';
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
}

export const PollCard = memo(({ poll, compact = false }: PollCardProps) => {
  const { voteOnOption, reactToOption, userVotes, userReactions } = usePollStore();
  const [mounted, setMounted] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({});
  const [barsReady, setBarsReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [optionImageErrors, setOptionImageErrors] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get main image
  const mainImage = poll.options[0]?.imageUrl;
  
  // Memoize userReactions to prevent infinite re-renders
  const userReactionsMemo = useMemo(() => userReactions[poll.id] || {}, [userReactions, poll.id]);
  
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
    
    // Add main image if exists
    if (mainImage) {
      images.push({
        url: mainImage,
        title: poll.title
      });
    }
    
    // Add option images
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
    
    // Start with all bars hidden
    setBarsReady(false);
    
    // Start with all bars at 0%
    const percentages: Record<string, number> = {};
    poll.options.forEach((option: any) => {
      percentages[option.id] = 0;
    });
    
    setAnimatedPercentages(percentages);
    
    // Mark bars as ready and animate to actual percentages after delay
    const timer = setTimeout(() => {
      setBarsReady(true);
      const finalPercentages: Record<string, number> = {};
      poll.options.forEach((option: any) => {
        const percentage = totalVotes > 0 ? Math.round((getPositiveVotes(option.reactions) / totalVotes) * 100) : 0;
        finalPercentages[option.id] = percentage;
      });
      setAnimatedPercentages(finalPercentages);
    }, 500); // Increased delay
    
    return () => clearTimeout(timer);
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
  const getTopReactions = useCallback((reactions: Record<string, number>) => {
    return Object.entries(reactions)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);
  }, []);
  
  const userVotedOption = userVotes[poll.id];
  const isCompact = compact;
  
  // Fixed layout with scroll only for options
  const cardHeight = isCompact ? 'h-[500px]' : 'h-[600px]';
  
  return (
    <div className="block">
      <motion.div 
        className={`poll-card ${isCompact ? cardHeight : cardHeight} bg-white rounded-[24px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 border border-[var(--border)] @media(hover:hover):hover:-translate-y-1 active:scale-[0.98] flex flex-col cursor-pointer overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => window.location.href = `/polls/${poll.id}`}
      >
      {/* Image Section - Fixed at top */}
      <div className="relative h-[160px] sm:h-[180px] md:h-[200px] flex-shrink-0 rounded-t-[24px] overflow-hidden">
        {mainImage && !imageError ? (
          <>
            <div 
              className="relative w-full h-full cursor-pointer group"
              onClick={() => handleImageClick(0)}
            >
              <Image
                src={mainImage}
                alt={poll.options[0]?.title || poll.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0h3m-3 0h3" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center relative"
            style={{ background: getGradient(poll.title) }}
          >
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
              <span className="text-5xl font-bold text-white drop-shadow-lg">
                {poll.title.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        )}
      </div>
      
      {/* Content Section - Scrollable */}
      <div className="flex flex-col flex-1 overflow-hidden overflow-x-hidden">
        {/* Title and Status - Fixed */}
        <div className="p-4 sm:p-5 flex-shrink-0">
          <h3 className="font-display font-bold text-[var(--text)] text-lg sm:text-xl mb-2 line-clamp-2">
            {poll.title}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <div className="w-6 h-6 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-xs font-medium">
                {getCreatorAvatar(poll.createdBy)}
              </div>
              <span>·</span>
              <span>{mounted ? formatDistanceToNow(poll.createdAt, { addSuffix: true }) : 'loading'}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isExpired 
                ? 'bg-gray-100 text-gray-600' 
                : 'bg-green-100 text-green-700'
            }`}>
              {!isExpired && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
              {isExpired ? 'Ended' : 'Active'}
            </div>
          </div>
        </div>
        
        {/* Options - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5" style={{ contain: 'layout style' }}>
          <div className="space-y-2 sm:space-y-3 py-2 overflow-hidden">
            {poll.options.map((option: any, index: any) => {
              const percentage = totalVotes > 0 ? Math.min(Math.round((getPositiveVotes(option.reactions) / totalVotes) * 100), 100) : 0;
              const animatedPercentage = animatedPercentages[option.id] || 0;
              const topReactions = getTopReactions(option.reactions);
              const hasVoted = userVotedOption === option.id;
              
              return (
                <div
                  key={option.id}
                  className={`cursor-pointer transition-all rounded-xl overflow-hidden overflow-x-hidden ${
                    !isExpired && !userVotedOption ? 'hover:bg-[var(--surface)] p-2' : ''
                  } ${hasVoted ? 'border-2 border-[var(--primary)] p-2' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote(option.id);
                  }}
                  style={{ contain: 'layout style' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {option.imageUrl && !optionImageErrors[option.id] ? (
                        <Image
                          src={option.imageUrl}
                          alt={option.title}
                          width={20}
                          height={20}
                          className="rounded object-cover"
                          onError={() => setOptionImageErrors(prev => ({ ...prev, [option.id]: true }))}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                          {option.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-xs sm:text-sm text-[var(--text)]">
                        {option.title}
                      </span>
                      {hasVoted && (
                        <span className="text-[var(--primary)] text-xs sm:text-sm">✓</span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[var(--text)]">
                      {percentage}%
                    </span>
                  </div>
                  
                  {/* Progress Bar - Using transform instead of width */}
                  <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 sm:h-2 mb-1.5 sm:mb-2 overflow-hidden">
                    <div 
                      className="bg-[var(--primary)] h-1.5 sm:h-2 rounded-full origin-left"
                      style={{ 
                        transform: `scaleX(${Math.min(percentage, 100) / 100})`,
                        width: '100%'
                      }}
                    />
                  </div>
                  
                  {/* Reaction Pills - Fully rounded */}
                  {topReactions.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {topReactions.map(([emoji, count]) => (
                        <div
                          key={emoji}
                          className="bg-[var(--primary-light)] text-[var(--primary)] text-xs px-2 py-1 rounded-full"
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
        </div>
        
        {/* Footer - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[var(--border)] flex-shrink-0">
          <div className="text-xs sm:text-sm text-[var(--text-muted)]">
            {totalVotes} votes · {mounted ? timeRemaining.replace('in ', '') : 'loading'}
          </div>
          
          <span className="text-xs sm:text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-1">
            View →
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
