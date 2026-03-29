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

export default function PollDetail({ pollId }: PollDetailProps) {
  const { voteOnOption, reactToOption, getPollById, userVotes, userReactions: userReactionsStore } = usePollStore();
  const [activeTab, setActiveTab] = useState<TabType>('vote');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showReactionStrip, setShowReactionStrip] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<Record<string, string>>({});
  
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
    return new Date(poll.expiresAt) < new Date();
  }, [poll]);
  
  const userVotedOption = poll ? userVotes[poll.id] : undefined;
  
  // Set default tab based on poll status
  useEffect(() => {
    if (poll) {
      setActiveTab(hasEnded ? 'results' : 'vote');
    }
  }, [hasEnded, poll]);
  
  // Countdown timer
  useEffect(() => {
    if (hasEnded || !poll) return;
    
    const updateTimer = () => {
      const now = new Date();
      const expiryDate = new Date(poll.expiresAt);
      const diff = expiryDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Ended');
        return;
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
  }, [poll.expiresAt, hasEnded]);
  
  // Handle voting
  const handleVote = (optionId: string) => {
    if (hasEnded || userVotedOption) return;
    voteOnOption(poll.id, optionId);
    setShowReactionStrip(optionId);
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
          
          {/* Share Button */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--surface)] hover:bg-[var(--surface-2)] rounded-full transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
            </svg>
            <span className="text-sm font-medium">Share</span>
          </button>
          <button className="md:hidden p-2 bg-[var(--surface)] hover:bg-[var(--surface-2)] rounded-full transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
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
              <span>{formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
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
          
          {/* Countdown Timer */}
          {!hasEnded && timeRemaining && (
            <div className="text-sm font-mono text-[var(--text)]">
              {timeRemaining}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-[24px] shadow-[var(--shadow-sm)] border border-[var(--border)] p-2 mb-6 sticky top-4 z-10 md:top-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all min-h-[44px] ${
              activeTab === 'vote'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
            }`}
          >
            <span>🗳️</span>
            <span className="hidden sm:inline">Vote</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-all min-h-[44px] ${
              activeTab === 'results'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface)]'
            }`}
          >
            <span>🏆</span>
            <span className="hidden sm:inline">Results</span>
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'vote' && (
          <motion.div
            key="vote"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ResultsTab
              poll={poll}
              totalVotes={totalVotes}
              hasEnded={hasEnded}
              getGradient={getGradient}
              getTopReactions={getTopReactions}
              isTie={isTie}
              getSortedOptions={getSortedOptions}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Vote Tab Component
function VoteTab({
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
}) {
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
                onClick={() => !hasEnded && !userVotedOption && onVote(option.id)}
                whileHover={!hasEnded && !userVotedOption ? { scale: 1.02 } : {}}
                whileTap={!hasEnded && !userVotedOption ? { scale: 0.98 } : {}}
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
                        {hasVoted && <span className="ml-2 text-[var(--primary)]">✓ Your vote</span>}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                        <span>{optionVotes} votes</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-[var(--surface)] rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-[var(--primary)] h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                
                {/* Selected Reaction Badge */}
                {userReaction && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-[var(--text-muted)]">You reacted:</span>
                    <div className="bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full text-sm font-medium">
                      {userReaction} 1
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Reaction Strip */}
              <AnimatePresence>
                {showReactionStrip === option.id && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    {/* Positive Reactions */}
                    <div className="flex gap-2 justify-center">
                      {POSITIVE_EMOJIS.map((emoji) => (
                        <motion.button
                          key={emoji}
                          onClick={() => onReaction(option.id, emoji)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-green-50 hover:bg-green-100 border border-green-200 flex items-center justify-center text-2xl transition-all hover:scale-110"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          title="Counts as vote"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                    {/* Negative Reactions */}
                    <div className="flex gap-2 justify-center">
                      {NEGATIVE_EMOJIS.map((emoji) => (
                        <motion.button
                          key={emoji}
                          onClick={() => onReaction(option.id, emoji)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-2xl transition-all hover:scale-110"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          title="Visual reaction only"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      <span className="text-green-600">👍 ❤️ 😂 🔥</span> count as votes • 
                      <span className="text-red-600"> 👎 😡</span> are visual only
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      {/* Aggregate Reaction Summary */}
      {totalVotes > 0 && (
        <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4">
          <h3 className="font-display font-semibold text-[var(--text)] mb-3">Top Reactions</h3>
          <div className="space-y-2">
            {/* Positive Reactions */}
            <div>
              <div className="text-xs text-green-600 font-medium mb-1">Voting Reactions</div>
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  const positiveReactions: Record<string, number> = {};
                  POSITIVE_EMOJIS.forEach(emoji => {
                    positiveReactions[emoji] = 0;
                  });
                  poll.options.forEach(option => {
                    POSITIVE_EMOJIS.forEach(emoji => {
                      positiveReactions[emoji] += option.reactions[emoji];
                    });
                  });
                  
                  return Object.entries(positiveReactions)
                    .filter(([_, count]) => count > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([emoji, count]) => (
                      <div key={emoji} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {emoji} {count}
                      </div>
                    ));
                })()}
              </div>
            </div>
            {/* Negative Reactions */}
            <div>
              <div className="text-xs text-red-600 font-medium mb-1">Visual Reactions</div>
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  const negativeReactions: Record<string, number> = {};
                  NEGATIVE_EMOJIS.forEach(emoji => {
                    negativeReactions[emoji] = 0;
                  });
                  poll.options.forEach(option => {
                    NEGATIVE_EMOJIS.forEach(emoji => {
                      negativeReactions[emoji] += option.reactions[emoji];
                    });
                  });
                  
                  return Object.entries(negativeReactions)
                    .filter(([_, count]) => count > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([emoji, count]) => (
                      <div key={emoji} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                        {emoji} {count}
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Results Tab Component
function ResultsTab({
  poll,
  totalVotes,
  hasEnded,
  getGradient,
  getTopReactions,
  isTie,
  getSortedOptions
}: {
  poll: Poll;
  totalVotes: number;
  hasEnded: boolean;
  getGradient: (title: string) => string;
  getTopReactions: (reactions: Record<string, number>) => [string, number][];
  isTie: () => boolean;
  getSortedOptions: () => Poll['options'];
}) {
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
          <div className="flex items-end justify-center gap-4 md:gap-8">
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
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl mb-2">
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
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl mb-2">
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
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl mb-2">
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
          <h2 className="font-display text-2xl font-bold text-[var(--text)] mb-2">It's a tie!</h2>
          <p className="text-[var(--text-muted)]">The top options are within 2% of each other</p>
        </div>
      )}
      
      {/* Full Results List */}
      <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-6">
        <h3 className="font-display text-xl font-bold text-[var(--text)] mb-6">Complete Results</h3>
        <div className="space-y-4">
          {sortedOptions.map((option, index) => {
            const optionVotes = getPositiveVotes(option.reactions);
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            const topReactions = getTopReactions(option.reactions);
            
            return (
              <div key={option.id} className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                
                {/* Option Image */}
                {option.imageUrl ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={option.imageUrl}
                      alt={option.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface)] flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {option.title.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Option Name and Progress */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-[var(--text)]">{option.title}</h4>
                    <span className="text-sm font-medium text-[var(--text)]">{percentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--surface)] rounded-full h-2">
                    <div
                      className="bg-[var(--primary)] h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                {/* Reactions */}
                {topReactions.length > 0 && (
                  <div className="flex gap-1">
                    {topReactions.map(([emoji, count]) => (
                      <div key={emoji} className="bg-[var(--primary-light)] text-[var(--primary)] px-2 py-1 rounded-full text-xs font-medium">
                        {emoji} {count}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Vote Count */}
                <div className="text-sm text-[var(--text-muted)] font-medium">
                  {optionVotes}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
            <span>Total participants: {totalVotes}</span>
            <span>Created by {poll.createdBy}</span>
            <span>{formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
