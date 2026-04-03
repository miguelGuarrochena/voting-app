'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import usePollStore from '@/store/pollStore';
import { Poll, getPositiveVotes, POSITIVE_REACTIONS, NEGATIVE_REACTIONS, ALL_SUPPORTED_REACTIONS } from '@/types/poll';
import Image from 'next/image';
import { getCreatorAvatar } from '@/data/mockPolls';
import confetti from 'canvas-confetti';

// Define the reaction emojis separated by type
const POSITIVE_EMOJIS = POSITIVE_REACTIONS;
const NEGATIVE_EMOJIS = NEGATIVE_REACTIONS;
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

type TabType = 'vote' | 'results';

interface PollDetailProps {
  pollId: string;
}

const PollDetail = ({ pollId }: PollDetailProps) => {
  const { voteOnOption, reactToOption, getPollById, userVotes, userReactions: userReactionsStore } = usePollStore();
  const [activeTab, setActiveTab] = useState<TabType>('vote');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showReactionStrip, setShowReactionStrip] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get the poll from the store
  const poll = getPollById(pollId);
  
  // Memoize userReactions to prevent infinite re-renders
  const userReactions = useMemo(() => poll ? userReactionsStore[poll.id] || {} : {}, [userReactionsStore, poll?.id]);
  
  if (!poll) {
    return <div className="text-center py-8">Poll not found</div>;
  }
  
  // Calculate total votes and check if poll has ended (only positive reactions count)
  const totalVotes = useMemo(() => {
    if (!poll) return 0;
    return poll.options.reduce((sum, option) => sum + getPositiveVotes(option.reactions), 0);
  }, [poll]);
  
  const hasEnded = useMemo(() => {
    if (!poll) return true;
    const now = new Date();
    const expiryDate = new Date(poll.expiresAt);
    return expiryDate <= now; // Use <= instead of < to catch exact expiry times
  }, [poll?.expiresAt]); // More specific dependency
  
  const userVotedOption = poll ? userVotes[poll.id] : undefined;
  
  // Set default tab based on poll status
  useEffect(() => {
    if (poll) {
      setActiveTab(hasEnded ? 'results' : 'vote');
    }
  }, [hasEnded, poll]);
  
  // Countdown timer
  useEffect(() => {
    if (!poll || hasEnded) {
      setTimeRemaining(hasEnded ? 'Ended' : '');
      return;
    }
    
    const updateTimer = () => {
      const now = new Date();
      const expiryDate = new Date(poll.expiresAt);
      const diff = expiryDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Ended');
        return; // Don't continue if ended
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${days.toString().padStart(2, '0')} : ${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [poll?.expiresAt, hasEnded]);
  
  // Handle voting
  const handleVote = (optionId: string) => {
    if (hasEnded) return;
    // Allow vote changing - remove the check for existing vote
    voteOnOption(poll.id, optionId);
    // Don't automatically show reaction strip - let users choose to react
  };
  
  // Handle reaction
  const handleReaction = (optionId: string, emoji: string) => {
    reactToOption(poll.id, optionId, emoji);
    setSelectedReaction(prev => ({ ...prev, [optionId]: emoji }));
    setShowReactionStrip(null);
  };
  
  // Get gradient for no-image fallback
  const getGradient = (title: string) => {
    const index = title.charCodeAt(0) % GRADIENTS.length;
    return GRADIENTS[index];
  };
  
  // Get top reactions for an option
  const getTopReactions = (reactions: Record<string, number>): [string, number][] => {
    return Object.entries(reactions)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3) as [string, number][];
  };
  
  // Get sorted options for results (based on positive votes only)
  const getSortedOptions = () => {
    return [...poll.options].sort((a, b) => {
      const aVotes = getPositiveVotes(a.reactions);
      const bVotes = getPositiveVotes(b.reactions);
      return bVotes - aVotes;
    });
  };
  
  // Check if it's a tie (based on positive votes only)
  const isTie = () => {
    const sorted = getSortedOptions();
    if (sorted.length < 2) return false;
    
    const firstVotes = getPositiveVotes(sorted[0].reactions);
    const secondVotes = getPositiveVotes(sorted[1].reactions);
    
    return Math.abs(firstVotes - secondVotes) <= Math.max(firstVotes, secondVotes) * 0.02;
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Poll Header */}
      <div className="bg-white rounded-[24px] shadow-[var(--shadow-sm)] border border-[var(--border)] p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] mb-2">
              {poll.title}
            </h1>
            {poll.description && (
              <p className="font-body text-[var(--text-muted)] text-base mb-4">
                {poll.description}
              </p>
            )}
          </div>
          
          {/* Share Button - Classic Share Icon */}
          <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg transition-all rounded-full font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="text-sm font-medium">Share</span>
          </button>
          <button className="md:hidden p-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg transition-all rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
        
        {/* Creator Info */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-sm font-medium">
              {getCreatorAvatar(poll.createdBy)}
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span>{poll.createdBy}</span>
              <span>•</span>
              <span>{mounted ? formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true }) : 'just now'}</span>
              <span>•</span>
              <span>{totalVotes} votes</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              hasEnded 
                ? 'bg-gray-100 text-gray-600' 
                : 'bg-green-100 text-green-700'
            }`}>
              {hasEnded ? 'Ended' : 'Active'}
            </div>
          </div>
          
          {/* Countdown Timer - Subtle Design */}
          {!hasEnded && timeRemaining && (
            <div className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] px-3 py-1.5 rounded-full text-xs font-medium">
              ⏰ {timeRemaining}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-[24px] shadow-[var(--shadow-sm)] border border-[var(--border)] p-2 mb-6">
        <div className="flex gap-2 relative">
          {/* Animated background indicator */}
          <motion.div
            className="absolute inset-y-2 bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{
              width: 'calc(50% - 4px)',
              left: activeTab === 'vote' ? '4px' : 'calc(50% + 4px)',
            }}
            layout
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
          />
          
          <motion.button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all min-h-[44px] relative z-10 ${
              activeTab === 'vote'
                ? 'text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.02 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }}
          >
            <motion.svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              animate={{ 
                rotate: activeTab === 'vote' ? [0, -5, 5, 0] : 0 
              }}
              transition={{ 
                duration: 0.5, 
                repeat: activeTab === 'vote' ? Infinity : 0,
                repeatDelay: 2
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </motion.svg>
            <span>Vote</span>
            <span className="hidden sm:inline">on poll</span>
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('results')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all min-h-[44px] relative z-10 ${
              activeTab === 'results'
                ? 'text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.02 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }}
          >
            <motion.svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              animate={{ 
                rotate: activeTab === 'results' ? [0, -5, 5, 0] : 0 
              }}
              transition={{ 
                duration: 0.5, 
                repeat: activeTab === 'results' ? Infinity : 0,
                repeatDelay: 2
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </motion.svg>
            <span>Results</span>
          </motion.button>
        </div>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'vote' && (
          <motion.div
            key="vote"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.16, 1, 0.3, 1] // More dramatic easing
            }}
          >
            <VoteTab
              poll={poll}
              totalVotes={totalVotes}
              hasEnded={hasEnded}
              userVotedOption={userVotedOption}
              userReactions={userReactions}
              showReactionStrip={showReactionStrip}
              selectedReaction={selectedReaction}
              onVote={handleVote}
              onReaction={handleReaction}
              onToggleReactionStrip={setShowReactionStrip}
              getGradient={getGradient}
              getTopReactions={getTopReactions}
            />
          </motion.div>
        )}
        
        {activeTab === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.16, 1, 0.3, 1] // More dramatic easing
            }}
          >
            <ResultsTab
              poll={poll}
              totalVotes={totalVotes}
              hasEnded={hasEnded}
              getGradient={getGradient}
              getTopReactions={getTopReactions}
              isTie={isTie}
              getSortedOptions={getSortedOptions}
              mounted={mounted}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PollDetail;

// Vote Tab Component
const VoteTab = ({
  poll,
  totalVotes,
  hasEnded,
  userVotedOption,
  userReactions,
  showReactionStrip,
  selectedReaction,
  onVote,
  onReaction,
  onToggleReactionStrip,
  getGradient,
  getTopReactions
}: {
  poll: Poll;
  totalVotes: number;
  hasEnded: boolean;
  userVotedOption: string | undefined;
  userReactions: Record<string, string>;
  showReactionStrip: string | null;
  selectedReaction: Record<string, string>;
  onVote: (optionId: string) => void;
  onReaction: (optionId: string, emoji: string) => void;
  onToggleReactionStrip: (optionId: string | null) => void;
  getGradient: (title: string) => string;
  getTopReactions: (reactions: Record<string, number>) => [string, number][];
}) => {
  const optionsWithImages = poll.options.filter(option => option.imageUrl);
  
  return (
    <div className="space-y-6">
      {/* Image Grid for Desktop */}
      {optionsWithImages.length > 0 && (
        <div className="hidden md:grid gap-4" style={{
          gridTemplateColumns: optionsWithImages.length === 2 ? '1fr 1fr' :
                              optionsWithImages.length === 3 ? 'repeat(3, 1fr)' :
                              'repeat(2, 1fr)'
        }}>
          {optionsWithImages.map((option) => (
            <div key={option.id} className="relative h-[300px] rounded-[var(--radius-md)] overflow-hidden group">
              <Image
                src={option.imageUrl!}
                alt={option.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-display font-semibold">{option.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Mobile Stacked Images */}
      {optionsWithImages.length > 0 && (
        <div className="md:hidden space-y-4">
          {optionsWithImages.map((option) => (
            <div key={option.id} className="relative h-[200px] min-h-[160px] rounded-[var(--radius-md)] overflow-hidden">
              <Image
                src={option.imageUrl!}
                alt={option.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-display font-semibold">{option.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Voting Cards */}
      <div className="space-y-4 px-4 md:px-0">
        {poll.options.map((option) => {
          const optionVotes = getPositiveVotes(option.reactions);
          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const hasVoted = userVotedOption === option.id;
          const topReactions = getTopReactions(option.reactions);
          const userReaction = userReactions[option.id];
          
          return (
            <div key={option.id} className="space-y-3">
              <motion.div
                className={`bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border-2 p-4 cursor-pointer transition-all w-full ${
                  hasVoted ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:border-[var(--primary-light)]'
                }`}
                onClick={() => !hasEnded && onVote(option.id)}
                onDoubleClick={() => !hasEnded && onToggleReactionStrip(showReactionStrip === option.id ? null : option.id)}
                whileHover={!hasEnded ? { scale: 1.02 } : {}}
                whileTap={!hasEnded ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {option.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={option.imageUrl}
                          alt={option.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-[var(--text)] mb-1">
                        {option.title}
                        {hasVoted && <span className="ml-2 text-[var(--primary)]">✓ {userVotedOption === option.id ? 'Your vote (click to change)' : 'Click to vote'}</span>}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                        <span>{optionVotes} votes</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-bar-container w-full bg-[var(--surface)] rounded-full h-2">
                  <motion.div
                    className="progress-bar-fill bg-[var(--primary)] h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                
                {/* Selected Reaction Badge - Clickable to change */}
                {userReaction && (
                  <div className="flex items-center gap-1 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleReactionStrip(showReactionStrip === option.id ? null : option.id);
                      }}
                      className="bg-[var(--primary-light)] text-[var(--primary)] px-2 py-1 rounded-full text-sm hover:bg-[var(--primary)] hover:text-white transition-colors"
                    >
                      {userReaction}
                    </button>
                  </div>
                )}
                
                {/* Add Reaction Button - When no reaction exists */}
                {!userReaction && !hasEnded && (
                  <div className="flex items-center gap-1 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleReactionStrip(showReactionStrip === option.id ? null : option.id);
                      }}
                      className="bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] rounded-full px-2 py-1 text-sm transition-colors flex items-center gap-1"
                    >
                      <span className="text-base">😊</span>
                      <span>React</span>
                    </button>
                  </div>
                )}
              </motion.div>
              
              {/* Reaction Strip - WhatsApp style */}
              <AnimatePresence>
                {showReactionStrip === option.id && !hasEnded && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-[16px] shadow-lg border border-[var(--border)] p-3"
                  >
                    <div className="flex gap-2 justify-center">
                      {REACTION_EMOJIS.map((emoji) => (
                        <motion.button
                          key={emoji}
                          onClick={() => onReaction(option.id, emoji)}
                          className="w-10 h-10 rounded-full hover:bg-[var(--surface)] flex items-center justify-center text-2xl transition-all hover:scale-110"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {/* Simple Reaction Summary */}
      {totalVotes > 0 && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4">
          <h3 className="font-display font-semibold text-[var(--text)] mb-3">Reactions</h3>
          <div className="flex gap-2 flex-wrap">
            {(() => {
              const allReactions: Record<string, number> = {};
              REACTION_EMOJIS.forEach(emoji => {
                allReactions[emoji] = 0;
              });
              poll.options.forEach(option => {
                REACTION_EMOJIS.forEach(emoji => {
                  allReactions[emoji] += option.reactions[emoji];
                });
              });
              
              return Object.entries(allReactions)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .map(([emoji, count]) => (
                  <div key={emoji} className="bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full text-sm font-medium">
                    {emoji} {count}
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Get avatar colors for options
const getAvatarColors = (title: string, index: number) => {
  const gradients = [
    'from-purple-500 to-purple-700',
    'from-blue-500 to-blue-700', 
    'from-green-500 to-green-700',
    'from-red-500 to-red-700',
    'from-yellow-500 to-yellow-700',
    'from-pink-500 to-pink-700',
    'from-indigo-500 to-indigo-700',
    'from-teal-500 to-teal-700'
  ];
  // Use both title character and index to ensure uniqueness
  const charCode = title.charCodeAt(0);
  const colorIndex = (charCode + index) % gradients.length;
  return gradients[colorIndex];
};

// Results Tab Component
const ResultsTab = ({
  poll,
  totalVotes,
  hasEnded,
  getGradient,
  getTopReactions,
  isTie,
  getSortedOptions,
  mounted
}: {
  poll: Poll;
  totalVotes: number;
  hasEnded: boolean;
  getGradient: (title: string) => string;
  getTopReactions: (reactions: Record<string, number>) => [string, number][];
  isTie: () => boolean;
  getSortedOptions: () => Poll['options'];
  mounted: boolean;
}) => {
  const sortedOptions = getSortedOptions();
  const tie = isTie();
  
  // Trigger confetti when poll is ended and we're on results tab
  useEffect(() => {
    if (hasEnded && !tie && totalVotes > 0) {
      confetti({
        particleCount: 120,
        spread: 90,
        colors: ['#FF4D6A', '#FFD700', '#2DD4A0', '#FFF8FA']
      });
    }
  }, [hasEnded, tie, totalVotes]);
  
  return (
    <div className="space-y-8">
      {/* Podium */}
      {!tie && sortedOptions.length >= 2 && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-8">
          <div className="flex items-end justify-center gap-4 md:gap-8 overflow-hidden">
            {/* 2nd Place */}
            {sortedOptions[1] && (
              <motion.div
                className="flex flex-col items-center"
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="text-4xl mb-2">🥈</div>
                {sortedOptions[1].imageUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                    <Image
                      src={sortedOptions[1].imageUrl}
                      alt={sortedOptions[1].title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full bg-gradient-to-br ${getAvatarColors(sortedOptions[1].title, 1)} flex items-center justify-center text-white font-bold text-2xl">${sortedOptions[1].title.charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColors(sortedOptions[1].title, 1)} flex items-center justify-center text-white font-bold text-2xl mb-2`}>
                    {sortedOptions[1].title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-sm font-medium text-center mb-2 line-clamp-1">
                  {sortedOptions[1].title}
                </div>
                <div className="w-20 bg-[#C0C0C0] rounded-t-lg flex items-center justify-center text-white font-bold py-8">
                  {Math.round((getPositiveVotes(sortedOptions[1].reactions) / totalVotes) * 100)}%
                </div>
              </motion.div>
            )}
            
            {/* 1st Place */}
            {sortedOptions[0] && (
              <motion.div
                className="flex flex-col items-center"
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="text-4xl mb-2">🥇</div>
                {sortedOptions[0].imageUrl ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-2">
                    <Image
                      src={sortedOptions[0].imageUrl}
                      alt={sortedOptions[0].title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full bg-gradient-to-br ${getAvatarColors(sortedOptions[0].title, 0)} flex items-center justify-center text-white font-bold text-3xl">${sortedOptions[0].title.charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarColors(sortedOptions[0].title, 0)} flex items-center justify-center text-white font-bold text-3xl mb-2`}>
                    {sortedOptions[0].title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-base font-medium text-center mb-2 line-clamp-1">
                  {sortedOptions[0].title}
                </div>
                <div className="w-24 bg-[#FFD700] rounded-t-lg flex items-center justify-center text-white font-bold py-12">
                  {Math.round((getPositiveVotes(sortedOptions[0].reactions) / totalVotes) * 100)}%
                </div>
              </motion.div>
            )}
            
            {/* 3rd Place */}
            {sortedOptions[2] && (
              <motion.div
                className="flex flex-col items-center"
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="text-4xl mb-2">🥉</div>
                {sortedOptions[2].imageUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                    <Image
                      src={sortedOptions[2].imageUrl}
                      alt={sortedOptions[2].title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full bg-gradient-to-br ${getAvatarColors(sortedOptions[2].title, 2)} flex items-center justify-center text-white font-bold text-2xl">${sortedOptions[2].title.charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColors(sortedOptions[2].title, 2)} flex items-center justify-center text-white font-bold text-2xl mb-2`}>
                    {sortedOptions[2].title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-sm font-medium text-center mb-2 line-clamp-1">
                  {sortedOptions[2].title}
                </div>
                <div className="w-20 bg-[#CD7F32] rounded-t-lg flex items-center justify-center text-white font-bold py-6">
                  {Math.round((getPositiveVotes(sortedOptions[2].reactions) / totalVotes) * 100)}%
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
      
      {/* Tie Banner */}
      {tie && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-8 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="font-display text-2xl font-bold text-[var(--text)] mb-2">It&apos;s a tie!</h2>
          <p className="text-[var(--text-muted)]">The top options are within 2% of each other</p>
        </div>
      )}
      
      {/* Full Results List */}
      <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4 sm:p-6 flex flex-col max-h-[400px]">
        <h3 className="font-display text-lg sm:text-xl font-bold text-[var(--text)] mb-4 sm:mb-6 flex-shrink-0">Complete Results</h3>
        <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          {sortedOptions.map((option, index) => {
            const optionVotes = getPositiveVotes(option.reactions);
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            const topReactions = getTopReactions(option.reactions);
            
            return (
              <div key={option.id} className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[32px_40px_1fr_50px_160px_40px] items-center gap-2 sm:gap-4">
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                
                {/* Mobile Layout - Combined content */}
                <div className="sm:hidden min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {/* Option Image */}
                    {option.imageUrl ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image
                          src={option.imageUrl}
                          alt={option.title}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full rounded-lg bg-gradient-to-br ${getAvatarColors(option.title, index)} flex items-center justify-center text-white font-medium text-xs">${option.title.charAt(0).toUpperCase()}</div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarColors(option.title, index)} flex items-center justify-center text-white font-medium text-xs flex-shrink-0`}>
                        {option.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Option Name */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-[var(--text)] text-sm truncate">{option.title}</h4>
                    </div>
                    
                    {/* Percentage */}
                    <div className="text-sm font-bold text-[var(--primary)] flex-shrink-0">
                      {percentage}%
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="progress-bar-container w-full bg-[var(--surface)] rounded-full h-2 mb-2">
                    <div
                      className="progress-bar-fill bg-[var(--primary)] h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {/* Reactions and Vote Count - Centered */}
                  <div className="flex items-center justify-center gap-3">
                    {topReactions.length > 0 ? (
                      <div className="flex gap-1 items-center">
                        {topReactions.slice(0, 2).map(([emoji, count]) => (
                          <span key={emoji} className="bg-[var(--primary-light)] text-[var(--primary)] px-1.5 py-0.5 rounded text-xs font-medium">
                            {emoji} {count}
                          </span>
                        ))}
                        {topReactions.length > 2 && (
                          <span className="text-[var(--text-muted)] text-xs">+{topReactions.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[var(--text-muted)] text-xs">No reactions</div>
                    )}
                    <div className="text-xs text-[var(--text-muted)] font-medium">
                      {optionVotes} {optionVotes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                </div>
                
                {/* Desktop Layout - Original structure */}
                <div className="hidden sm:grid grid-cols-subgrid gap-4 col-span-5 items-center">
                  {/* Option Image */}
                  {option.imageUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                      <Image
                        src={option.imageUrl}
                        alt={option.title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full rounded-lg bg-gradient-to-br ${getAvatarColors(option.title, index)} flex items-center justify-center text-white font-medium text-sm">${option.title.charAt(0).toUpperCase()}</div>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColors(option.title, index)} flex items-center justify-center text-white font-medium text-sm`}>
                      {option.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Option Name and Progress */}
                  <div className="min-w-0">
                    <div className="mb-1">
                      <h4 className="font-medium text-[var(--text)] truncate">{option.title}</h4>
                    </div>
                    <div className="progress-bar-container w-full bg-[var(--surface)] rounded-full h-2">
                      <div
                        className="progress-bar-fill bg-[var(--primary)] h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Percentage Column - Fixed width 50px */}
                  <div className="text-sm font-medium text-[var(--text)] text-right pr-2">
                    {percentage}%
                  </div>
                  
                  {/* Reactions Column - Fixed width 160px */}
                  {topReactions.length > 0 ? (
                    <div className="flex gap-1 items-center">
                      {topReactions.map(([emoji, count]) => (
                        <span key={emoji} className="bg-[var(--primary-light)] text-[var(--primary)] px-2 py-1 rounded-lg text-xs font-medium inline-flex items-center">
                          {emoji} {count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div></div>
                  )}
                  
                  {/* Vote Count Column - Fixed width 40px */}
                  <div className="text-sm text-[var(--text-muted)] font-medium text-right">
                    {optionVotes}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--border)] flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-[var(--text-muted)] text-center sm:text-left">
            <span>{totalVotes} {totalVotes === 1 ? 'participant' : 'participants'}</span>
            <span>by {poll.createdBy}</span>
            <span>{mounted ? formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true }) : 'just now'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
