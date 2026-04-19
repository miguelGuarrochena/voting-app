'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import usePollStore from '@/store/pollStore';
import { Poll, PollOption, getPositiveVotes } from '@/types/poll';
import { useLanguage } from '@/context/LanguageContext';
import { getCreatorAvatar } from '@/data/mockPolls';
import { RankPollVote } from './RankPollVote';
import { RankPollResults } from './RankPollResults';


interface PollDetailProps {
  pollId: string;
}

// Avatar color generation function
const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
};

// Lightbox component
const Lightbox = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Enlarged view"
          className="max-w-full max-h-full object-contain"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
};

const PollDetail = ({ pollId }: PollDetailProps) => {
  const { t } = useLanguage();
  const { voteOnOption, getPollById, userVotes, userRankings, rankOptions, canUserAccessPoll, deletePoll } = usePollStore();
  const [activeTab, setActiveTab] = useState<'vote' | 'results'>('vote');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [mounted, setMounted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [confettiFired, setConfettiFired] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get the poll from the store
  const poll = getPollById(pollId);

  // Get poll type with default to 'vote'
  const pollType = poll?.type ?? 'vote';

  // Get user ranking for this poll
  const currentUser = 'current-user'; // In a real app, this would come from auth context
  const userRanking = userRankings[pollId]?.[currentUser];

  // Check if user has ranked this poll
  const hasRanked = !!userRanking;

  // Check if current user is the creator
  const isCreator = poll?.createdBy === currentUser;

  // Generate invite link for private polls
  const inviteLink = poll?.inviteToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${poll.inviteToken}` : null;

  if (!poll) {
    return <div className="text-center py-8">Poll not found</div>;
  }

  // Check if user has access to this poll
  const canAccess = canUserAccessPoll(pollId, currentUser);
  if (!canAccess) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border)] p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Access Denied</h1>
          <p className="text-[var(--text-muted)] mb-6">
            You don't have permission to view this poll. This is a private poll and you need an invite link to access it.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-[var(--surface)] text-[var(--text)] rounded-xl font-medium hover:bg-[var(--surface-2)] transition-colors"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
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

  // Auto-switch to results tab if poll has ended
  useEffect(() => {
    if (hasEnded && activeTab === 'vote') {
      setActiveTab('results');
    }
  }, [hasEnded, activeTab]);

  // Countdown timer
  useEffect(() => {
    if (!poll || hasEnded) {
      setTimeRemaining('This poll is closed');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiryDate = new Date(poll.expiresAt);
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('This poll is closed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`Closes in ${days} day${days > 1 ? 's' : ''}`);
      } else if (hours >= 1) {
        setTimeRemaining(`Closes in ${hours} hour${hours > 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`Closes in ${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute instead of every second

    return () => clearInterval(interval);
  }, [poll?.expiresAt, hasEnded]);

  // Confetti effect when poll ends
  useEffect(() => {
    if (hasEnded && !confettiFired) {
      setConfettiFired(true);
      
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [hasEnded, confettiFired]);
  
  // Handle voting
  const handleVote = (optionId: string) => {
    if (hasEnded) return;
    
    if (false) { // TODO: Add multipleChoice property to Poll type
      // Multi-choice: toggle selection
      setSelectedOptions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(optionId)) {
          newSet.delete(optionId);
        } else {
          newSet.add(optionId);
        }
        return newSet;
      });
    } else {
      // Single choice: vote immediately
      voteOnOption(poll.id, optionId);
      setHasVoted(true);
    }
  };
  
  // Handle multi-choice confirmation
  const handleConfirmVote = () => {
    if (selectedOptions.size > 0) {
      selectedOptions.forEach(optionId => {
        voteOnOption(poll.id, optionId);
      });
      setSelectedOptions(new Set());
      setHasVoted(true);
    }
  };

  // Handle ranking submission
  const handleRanking = (rankedOptionIds: string[]) => {
    rankOptions(poll.id, currentUser, rankedOptionIds);
  };

  // Handle copying invite link to clipboard
  const handleCopyInviteLink = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        // You could add a toast notification here
        alert('Invite link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: poll.title,
          text: `Vote on: ${poll.title}`,
          url: url,
        });
        return;
      } catch (err) {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  // Handle delete
  const handleDelete = () => {
    deletePoll(poll.id);
    router.push('/');
  };

  // Check if option is winner
  const getWinningOption = () => {
    if (!poll || totalVotes === 0) return null;
    return poll.options.reduce((winner, option) => {
      const winnerVotes = getPositiveVotes(winner.reactions);
      const optionVotes = getPositiveVotes(option.reactions);
      return optionVotes > winnerVotes ? option : winner;
    });
  };
  
  const winningOption = getWinningOption();

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 md:pb-0">
      {/* Poll Header */}
      <div className="bg-[var(--surface)] rounded-[20px] md:rounded-[24px] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-row items-start justify-between gap-3 mb-4">
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

          {/* Share Button - Icon only on mobile, full button on desktop */}
          <button onClick={handleShare} className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg transition-all rounded-full font-medium flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden md:inline text-sm font-medium ml-2">{shareCopied ? t('poll.copied') : t('poll.share')}</span>
          </button>
        </div>

        {/* Creator Info */}
        <div className="flex flex-col gap-1">
          {/* Line 1: avatar + username + Active badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {getCreatorAvatar(poll.createdBy)}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{poll.createdBy}</span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              hasEnded
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            }`}>
              {hasEnded ? t('poll.ended') : t('poll.active')}
            </div>
          </div>
          {/* Line 2: time • votes • timer */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span>{mounted ? formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true }) : 'just now'}</span>
            <span>•</span>
            <span>{totalVotes} votes</span>
            {!hasEnded && timeRemaining && (
              <>
                <span>•</span>
                <span>⏰ {timeRemaining}</span>
              </>
            )}
          </div>
        </div>

        {/* Invite Link Section - Only for creator of private polls */}
        {isCreator && poll.isPrivate && inviteLink && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-800 dark:text-blue-300 font-medium">🔒 Invite Link</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Only people with this link can see this poll</p>
                <div className="bg-[var(--surface)] border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-sm text-[var(--text)] break-all">
                  {inviteLink}
                </div>
              </div>
              <button
                onClick={handleCopyInviteLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-1 mb-4 md:mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('vote')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'vote'
                ? 'bg-[#f43f5e] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('poll.voteOnPoll')}</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'results'
                ? 'bg-[#f43f5e] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>{t('poll.results')}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'vote' && (
          <>
            {pollType === 'rank' ? (
              <RankPollVote
                poll={poll}
                onSubmitRanking={handleRanking}
                hasRanked={hasRanked}
                userRanking={userRanking}
              />
            ) : (
              <VoteContent
                poll={poll}
                totalVotes={totalVotes}
                hasEnded={hasEnded}
                userVotedOption={userVotedOption}
                hasVoted={hasVoted}
                onVote={handleVote}
                imageErrors={imageErrors}
                setImageErrors={setImageErrors}
                winningOption={winningOption}
                lightboxImage={lightboxImage}
                setLightboxImage={setLightboxImage}
              />
            )}
          </>
        )}

        {activeTab === 'results' && (
          <>
            {pollType === 'rank' ? (
              <RankPollResults
                poll={poll}
                allRankings={userRankings[pollId] || {}}
                totalParticipants={Object.keys(userRankings[pollId] || {}).length}
              />
            ) : (
              <ResultsContent
                poll={poll}
                totalVotes={totalVotes}
                hasEnded={hasEnded}
                userVotedOption={userVotedOption}
                winningOption={winningOption}
                imageErrors={imageErrors}
                setImageErrors={setImageErrors}
                lightboxImage={lightboxImage}
                setLightboxImage={setLightboxImage}
              />
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">{t('poll.deletePoll')}</h3>
              <p className="text-[var(--text-muted)] mb-6">
                {t('poll.deleteConfirm')}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg font-medium transition-colors"
                >
                  {t('poll.cancel')}
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowDeleteDialog(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  {t('poll.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger Zone - Delete Button */}
      {isCreator && !hasEnded && (
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 pb-32 md:pb-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide text-center mb-4">
            {t('poll.dangerZone')}
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600 transition-all"
            >
              🗑️ {t('poll.deletePoll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Results Content Component
const ResultsContent = ({
  poll,
  totalVotes,
  hasEnded,
  userVotedOption,
  winningOption,
  imageErrors,
  setImageErrors,
  lightboxImage,
  setLightboxImage
}: {
  poll: Poll;
  totalVotes: number;
  hasEnded: boolean;
  userVotedOption: string | undefined;
  winningOption: Poll['options'][0] | null;
  imageErrors: Record<string, boolean>;
  setImageErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  lightboxImage: string | null;
  setLightboxImage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  // Get letter from option title (first letter)
  const getOptionLetter = (title: string): string => {
    return title.charAt(0).toUpperCase();
  };

  // Get color for option based on letter
  const getOptionColor = (letter: string): string => {
    const colors: Record<string, string> = {
      'D': '#4CD964',
      'A': '#E57373',
      'S': '#AED581',
      'C': '#FF8A80',
    };
    return colors[letter] || getAvatarColor(letter);
  };

  // Sort options by votes for podium
  const sortedOptions = useMemo(() => {
    return [...poll.options].sort((a, b) => {
      const votesA = getPositiveVotes(a.reactions);
      const votesB = getPositiveVotes(b.reactions);
      return votesB - votesA;
    });
  }, [poll.options]);

  const top3 = sortedOptions.slice(0, 3);
  const remainingOptions = sortedOptions.slice(3);

  // Medal colors for podium
  const medalColors = ['bg-yellow-400', 'bg-gray-400', 'bg-amber-600']; // Gold, Silver, Bronze
  const medalBorders = ['border-yellow-500', 'border-gray-500', 'border-amber-700'];
  const podiumHeights = ['h-48', 'h-40', 'h-32']; // 1st tallest, 2nd middle, 3rd shortest
  const podiumOrder = top3.length >= 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0]; // 2nd, 1st, 3rd positions

  return (
    <div className="space-y-6">
      {/* Podium - Top 3 */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-2 sm:gap-4 mt-12 mb-8">
          {podiumOrder.map((sortedIndex) => {
            const option = top3[sortedIndex];
            const optionVotes = getPositiveVotes(option.reactions);
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            const letter = getOptionLetter(option.title);
            const letterColor = getOptionColor(letter);
            const isFirst = sortedIndex === 0;
            const hasImage = option.imageUrl && !imageErrors[option.id];

            return (
              <motion.div
                key={option.id}
                className="flex flex-col items-center relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sortedIndex * 0.1 }}
              >
                {/* Avatar with Crown */}
                <div className="relative mb-2">
                  {/* Crown for 1st place */}
                  {isFirst && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="text-3xl">👑</span>
                    </div>
                  )}

                  {/* Letter Avatar */}
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg border-4 border-white"
                    style={{ backgroundColor: hasImage ? undefined : letterColor }}
                  >
                    {hasImage ? (
                      <img
                        src={option.imageUrl}
                        alt={option.title}
                        className="w-full h-full object-cover"
                        onError={() => setImageErrors(prev => ({ ...prev, [option.id]: true }))}
                      />
                    ) : (
                      letter
                    )}
                  </div>
                </div>

                {/* Podium Card */}
                <div className={`relative w-24 sm:w-32 ${podiumHeights[sortedIndex]} rounded-t-xl border-2 ${medalBorders[sortedIndex]} ${medalColors[sortedIndex]} bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-end p-2 shadow-lg`}>
                  {/* Option Name */}
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center line-clamp-2 mb-1">
                    {option.title}
                  </span>

                  {/* Percentage */}
                  <span className="text-lg sm:text-xl font-bold text-[var(--text)]">
                    {percentage}%
                  </span>

                  {/* Rank Number */}
                  <div className={`absolute -bottom-3 w-6 h-6 rounded-full ${medalColors[sortedIndex]} border-2 ${medalBorders[sortedIndex]} flex items-center justify-center text-xs font-bold text-white`}>
                    {sortedIndex + 1}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Remaining Options - Compact Rows */}
      {remainingOptions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Other Options
          </h3>
          {remainingOptions.map((option, index) => {
            const rank = index + 4;
            const optionVotes = getPositiveVotes(option.reactions);
            const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
            const isUserChoice = userVotedOption === option.id;
            const letter = getOptionLetter(option.title);
            const letterColor = getOptionColor(letter);
            const hasImage = option.imageUrl && !imageErrors[option.id];

            return (
              <motion.div
                key={option.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Rank Number */}
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {rank}
                </div>

                {/* Letter Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0 relative"
                  style={{ backgroundColor: letterColor }}
                >
                  {hasImage ? (
                    <img
                      src={option.imageUrl}
                      alt={option.title}
                      className="w-full h-full object-cover rounded-full"
                      onError={() => setImageErrors(prev => ({ ...prev, [option.id]: true }))}
                    />
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-white">
                      {letter}
                    </span>
                  )}
                </div>

                {/* Name and Progress */}
                <div className="flex-1 min-w-0">
                  <span className={`font-medium text-sm truncate block ${isUserChoice ? 'text-[#f43f5e]' : 'text-[var(--text)]'}`}>
                    {option.title}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isUserChoice ? 'bg-[#f43f5e]' : 'bg-gray-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Percentage */}
                <span className={`text-lg font-bold flex-shrink-0 ${isUserChoice ? 'text-[#f43f5e]' : 'text-[var(--text-muted)]'}`}>
                  {percentage}%
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <Lightbox
            imageUrl={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Vote Content Component
const VoteContent = ({
  poll,
  totalVotes,
  hasEnded,
  userVotedOption,
  hasVoted,
  onVote,
  imageErrors,
  setImageErrors,
  winningOption,
  lightboxImage,
  setLightboxImage
}: {
  poll: Poll;
  totalVotes: number;
  hasEnded: boolean;
  userVotedOption: string | undefined;
  hasVoted: boolean;
  onVote: (optionId: string) => void;
  imageErrors: Record<string, boolean>;
  setImageErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  winningOption: Poll['options'][0] | null;
  lightboxImage: string | null;
  setLightboxImage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  // Local state for tracking which option is currently selected (before voting)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(userVotedOption || null);

  // Get letter from option title (first letter)
  const getOptionLetter = (title: string): string => {
    return title.charAt(0).toUpperCase();
  };

  // Get color for option based on letter
  const getOptionColor = (letter: string): string => {
    const colors: Record<string, string> = {
      'D': '#4CD964',
      'A': '#E57373',
      'S': '#AED581',
      'C': '#FF8A80',
    };
    return colors[letter] || getAvatarColor(letter);
  };

  // Handle card click - select the option
  const handleCardClick = (optionId: string) => {
    if (hasEnded) return;
    setSelectedOptionId(optionId);
    onVote(optionId);
  };

  return (
    <>
      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const optionVotes = getPositiveVotes(option.reactions);
          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const hasImage = option.imageUrl && !imageErrors[option.id];
          const letter = getOptionLetter(option.title);
          const letterColor = getOptionColor(letter);
          const isSelected = selectedOptionId === option.id;

          return (
            <motion.div
              key={option.id}
              className={`relative rounded-2xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-green-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              } bg-white`}
              onClick={() => handleCardClick(option.id)}
              whileHover={!hasEnded ? { scale: 1.01 } : {}}
              whileTap={!hasEnded ? { scale: 0.99 } : {}}
            >
              {/* Eye button - positioned absolutely over the image area */}
              {hasImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage(option.imageUrl || null);
                  }}
                  className="absolute bottom-2 left-2 z-10 w-7 h-7 bg-black/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/50 transition"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
              <div className="flex items-stretch h-28 sm:h-32">
                {/* Left - Letter Block (full height, green background) */}
                <div
                  className={`w-16 sm:w-20 flex-shrink-0 flex items-center justify-center relative rounded-l-2xl overflow-hidden ${
                    isSelected ? 'bg-green-500' : ''
                  }`}
                  style={{ backgroundColor: isSelected ? undefined : letterColor }}
                >
                  {hasImage ? (
                    <img
                      src={option.imageUrl}
                      alt={option.title}
                      className="w-full h-full object-cover"
                      onError={() => setImageErrors(prev => ({ ...prev, [option.id]: true }))}
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {letter}
                    </span>
                  )}

                  {/* Checkmark for selected option - on the letter avatar */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Right - Content Block */}
                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                  {/* Top row: Option Name */}
                  <h3 className="font-bold text-base sm:text-lg text-[var(--text)] truncate">
                    {option.title}
                  </h3>

                  {/* Middle row: Progress bar and percentage */}
                  <div className="flex items-center gap-2">
                    {/* Progress Bar */}
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Percentage - bold, green if selected, gray otherwise */}
                    <span className={`text-lg sm:text-xl font-bold flex-shrink-0 ${
                      isSelected ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <Lightbox
            imageUrl={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PollDetail;

