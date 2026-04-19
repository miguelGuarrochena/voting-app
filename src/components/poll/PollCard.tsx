'use client';

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Poll, getPositiveVotes, ALL_SUPPORTED_REACTIONS } from '@/types/poll';
import { usePollInteractions } from '@/hooks/useApi';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { UserAvatar } from '@/components/UserAvatar';
import { ImageGallery } from './ImageGallery';
import { useLanguage } from '@/context/LanguageContext';

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
  onDelete?: (pollId: string) => void;
}

export const PollCard = memo(({ poll, compact = false, className = "", onDelete }: PollCardProps) => {
  const { t } = useLanguage();
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
  const { isExpired, timeRemaining, totalVotes, hasVotes, urgencyBadge } = useMemo(() => {
    const now = new Date();
    const expiryDate = new Date(poll.expiresAt);
    const votes = poll.options.reduce((sum: number, option: any) => sum + getPositiveVotes(option.reactions), 0);
    const isExpired = expiryDate < now;
    const diff = expiryDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let urgencyBadge = null;
    if (!isExpired && hours < 24) {
      if (hours < 1) {
        urgencyBadge = { text: `Closes in ${minutes}m`, color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' };
      } else {
        urgencyBadge = { text: `Closes in ${hours}h`, color: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      }
    }

    return {
      isExpired,
      timeRemaining: formatDistanceToNow(expiryDate, { addSuffix: true }),
      totalVotes: votes,
      hasVotes: votes > 0,
      urgencyBadge
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
          title: option.title || ''
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

  const cardHeight = compact ? 'h-[400px] sm:h-[440px]' : 'h-[480px] sm:h-[520px]';
  
  // Get sorted options for podium display
  const getSortedOptions = useCallback(() => {
    return [...poll.options].sort((a, b) => {
      const aVotes = getPositiveVotes(a.reactions);
      const bVotes = getPositiveVotes(b.reactions);
      return bVotes - aVotes;
    });
  }, [poll.options]);
  
  const sortedOptions = getSortedOptions();
  
  return (
    <div className={`block ${className}`}>
      <motion.div 
        className={`${cardHeight} bg-[var(--surface)] rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 border border-[var(--border)] hover:-translate-y-1 active:scale-[0.98] flex flex-col cursor-pointer overflow-hidden group`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => window.location.href = `/polls/${poll.id}`}
      >
        {/* TOP ZONE - Fixed: Cover Image + Title + Author Avatar + Vote Count + Status Badge */}
        <div className="flex-shrink-0">
          {/* Image Section */}
          <div className="relative h-36 sm:h-40 rounded-t-3xl overflow-hidden">
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
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  {urgencyBadge && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium border border-[var(--warning)] bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]">
                      {urgencyBadge.text}
                    </div>
                  )}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${
                    isExpired
                      ? 'bg-[var(--badge-neutral-bg)]/80 text-[var(--badge-neutral-text)]'
                      : 'bg-[var(--badge-success-bg)]/80 text-[var(--badge-success-text)]'
                  }`}>
                    {!isExpired && <div className="w-2 h-2 bg-[var(--badge-success-text)] rounded-full animate-pulse" />}
                    {isExpired ? t('poll.ended') : t('poll.active')}
                  </div>
                </div>
              </>
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center relative"
                style={{ background: getGradient(poll.title) }}
              >
                {/* Avatar Circle */}
                <div className="w-20 h-20 rounded-full bg-[var(--surface)]/20 backdrop-blur-sm flex items-center justify-center border-4 border-[var(--surface)]/30">
                  <span className="text-4xl font-bold text-white drop-shadow-lg">
                    {poll.title.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  {urgencyBadge && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium border border-[var(--warning)] bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]">
                      {urgencyBadge.text}
                    </div>
                  )}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${
                    isExpired
                      ? 'bg-[var(--badge-neutral-bg)]/80 text-[var(--badge-neutral-text)]'
                      : 'bg-[var(--badge-success-bg)]/80 text-[var(--badge-success-text)]'
                  }`}>
                    {!isExpired && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    {isExpired ? t('poll.ended') : t('poll.active')}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Title and Meta Info */}
          <div className="p-4 sm:p-5 bg-[var(--surface)] border-b border-[var(--border)]">
            <h3 className="font-display font-bold text-[var(--text)] text-lg sm:text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {poll.title}
            </h3>
            
            {/* Meta info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <UserAvatar name={poll.createdBy} size="sm" />
                <span>{totalVotes} votes</span>
              </div>
              
              {/* Status indicator */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isExpired 
                  ? 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]' 
                  : 'bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]'
              }`}>
                {!isExpired && <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full" />}
                {isExpired ? t('poll.ended') : t('poll.active')}
              </div>
            </div>
          </div>
        </div>
        
        {/* MIDDLE ZONE - Scrollable: Results List */}
        <div className="flex-1 relative overflow-hidden bg-[var(--surface)]">
          <div className="h-full overflow-y-auto" style={{ maxHeight: '240px' }}>
            {hasVotes ? (
              <div className="p-4 sm:p-5 space-y-2">
                {sortedOptions.map((option: any, index: number) => {
                  const percentage = totalVotes > 0 ? Math.min(Math.round((getPositiveVotes(option.reactions) / totalVotes) * 100), 100) : 0;
                  const topReactions = getTopReactions(option.reactions);
                  const hasVotedForOption = votedOption === option.id;
                  
                  return (
                    <div
                      key={option.id}
                      className={`relative group transition-all rounded-xl overflow-hidden border ${
                        !isExpired && !hasVoted ? 'hover:border-primary hover:shadow-sm cursor-pointer' : 'border-transparent'
                      } ${hasVotedForOption ? 'border-2 border-primary bg-primary/5' : 'bg-surface/50'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoteClick(option.id);
                      }}
                    >
                      <div className="p-2 sm:p-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Rank */}
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}°
                          </div>
                          
                          {/* Option Image */}
                          {option.imageUrl && !optionImageErrors[option.id] ? (
                            <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={option.imageUrl}
                                alt={option.title}
                                fill
                                className="object-cover"
                                onError={() => setOptionImageErrors(prev => ({ ...prev, [option.id]: true }))}
                              />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${getGradient(option.title)} flex items-center justify-center text-white font-medium text-xs flex-shrink-0`}>
                              {option.title.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          {/* Option Name */}
                          <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                            {option.title}
                          </span>
                          
                          {/* Percentage */}
                          <span className="text-xs sm:text-sm font-bold text-primary flex-shrink-0">
                            {percentage}%
                          </span>
                          
                          {/* Vote indicator */}
                          {hasVotedForOption && (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs flex-shrink-0">
                              ✓
                            </div>
                          )}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-[var(--progress-track)] rounded-full h-1.5 mt-2 overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full origin-left"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: percentage / 100 }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            style={{ transformOrigin: 'left' }}
                          />
                        </div>
                        
                        {/* Top reactions */}
                        {topReactions.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="flex gap-1">
                              {topReactions.slice(0, 2).map(([emoji, count]) => (
                                <span key={emoji} className="bg-surface-2 px-1.5 py-0.5 rounded-full text-xs">
                                  {emoji} {count}
                                </span>
                              ))}
                            </div>
                            {topReactions.length > 2 && (
                              <span className="text-xs text-text-muted">+{topReactions.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 sm:p-5">
                <div className="text-center text-[var(--text-muted)]">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm">{t('poll.noVotesYet')}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Scroll fade indicator */}
          {hasVotes && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/80 to-transparent pointer-events-none" />
          )}
        </div>
        
        {/* BOTTOM ZONE - Fixed: Aggregated Reactions + View Poll Link */}
        <div className="flex-shrink-0 bg-[var(--surface)] border-t border-[var(--border)]">
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-2">
              {/* Delete button (if provided) */}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(poll.id);
                  }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{t('poll.eliminar')}</span>
                </button>
              )}
              {/* Top reactions summary */}
              {hasVotes && (() => {
                const allTopReactions: Record<string, number> = {};
                poll.options.forEach(option => {
                  const topReactions = getTopReactions(option.reactions);
                  topReactions.forEach(([emoji, count]) => {
                    allTopReactions[emoji] = (allTopReactions[emoji] || 0) + count;
                  });
                });
                
                const top3 = Object.entries(allTopReactions)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 3);
                
                return top3.length > 0 ? (
                  <div className="flex gap-1">
                    {top3.map(([emoji, count]) => (
                      <span key={emoji} className="text-xs bg-surface-2 px-2 py-1 rounded-full">
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            
            <span className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1 transition-colors cursor-pointer">
              {t('poll.viewPoll')}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
