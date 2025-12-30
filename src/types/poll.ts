// Types for our voting app

export type ReactionType = '👏' | '😄' | '❤️' | '🔥' | '😡' | '🤮' | '🍅' | '😈';

export interface ReactionCount {
  // Positive emojis (count towards ranking)
  '👏': number;
  '😄': number;
  '❤️': number;
  '🔥': number;
  // Negative emojis (expressive only)
  '😡': number;
  '🤮': number;
  '🍅': number;
  '😈': number;
}

export interface UserReaction {
  userId: string;
  pollId: string;
  optionId: string;
  emoji: ReactionType;
  timestamp: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  title: string;
  imageUrl?: string;
  reactions: ReactionCount;
  rank?: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  visibility: 'public' | 'private';
  options: PollOption[];
  totalReactions: number;
  views: number;
}

export interface FeedState {
  polls: Poll[];
  filter: 'trending' | 'recent' | 'expiring';
  setFilter: (filter: 'trending' | 'recent' | 'expiring') => void;
  loadPolls: () => void;
}

export interface PollDetailState {
  currentPoll: Poll | null;
  userReactions: Record<string, ReactionType>; // optionId -> emoji
  react: (optionId: string, emoji: ReactionType) => void;
  removeReaction: (optionId: string) => void;
}

// Utility functions
export const getTotalReactions = (reactions: ReactionCount): number => {
  return Object.values(reactions).reduce((sum, count) => sum + count, 0);
};

export const getTopReaction = (reactions: ReactionCount): { emoji: ReactionType; count: number } | null => {
  const entries = Object.entries(reactions) as [ReactionType, number][];
  if (entries.length === 0) return null;
  
  let topEmoji: ReactionType = entries[0][0];
  let topCount = entries[0][1];
  
  for (const [emoji, count] of entries) {
    if (count > topCount) {
      topEmoji = emoji;
      topCount = count;
    }
  }
  
  return topCount > 0 ? { emoji: topEmoji, count: topCount } : null;
};

export const isPositiveReaction = (emoji: ReactionType): boolean => {
  return ['👏', '😄', '❤️', '🔥'].includes(emoji);
};

// Helper to create an empty reaction count object
export const createEmptyReactions = (): ReactionCount => ({
  '👏': 0,
  '😄': 0,
  '❤️': 0,
  '🔥': 0,
  '😡': 0,
  '🤮': 0,
  '🍅': 0,
  '😈': 0,
});
