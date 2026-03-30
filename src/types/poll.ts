// Types for our voting app

export type ReactionType = string; // Allow any emoji string

export type ReactionCategory = 'positive' | 'negative';

export interface ReactionMeta {
  emoji: string;
  type: ReactionCategory;
}

// Dynamic reaction count type that supports any emoji
export type ReactionCount = Record<string, number>;

export interface UserReaction {
  userId: string;
  pollId: string;
  optionId: string;
  emoji: string; // Allow any emoji string
  timestamp: Date;
}

export interface UserVote {
  userId: string;
  pollId: string;
  optionId: string;
  timestamp: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  title: string;
  imageUrl?: string;
  reactions: ReactionCount;
  votes: number;
  rank?: number;
}

export interface Poll {
  id: string;
  title: string;
  titleImage?: string;
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
  userReactions: Record<string, string>; // optionId -> emoji (any string)
  react: (optionId: string, emoji: string) => void;
  removeReaction: (optionId: string) => void;
}

// Utility functions
export const getTotalReactions = (reactions: ReactionCount): number => {
  return Object.values(reactions).reduce((sum, count) => sum + count, 0);
};

export const getTopReaction = (reactions: ReactionCount): { emoji: string; count: number } | null => {
  const entries = Object.entries(reactions);
  if (entries.length === 0) return null;
  
  let topEmoji = '';
  let topCount = -1;
  
  for (const [emoji, count] of entries) {
    if (count > topCount) {
      topEmoji = emoji;
      topCount = count;
    }
  }
  
  return topCount > 0 ? { emoji: topEmoji, count: topCount } : null;
};

export const isPositiveReaction = (emoji: string): boolean => {
  return (POSITIVE_REACTIONS as readonly string[]).includes(emoji);
};

// Helper to create an empty reaction count object
export const createEmptyReactions = (): ReactionCount => ({});

// Helper to get positive votes only (for ranking)
export const getPositiveVotes = (reactions: ReactionCount): number => {
  return POSITIVE_REACTIONS.reduce((sum, emoji) => sum + (reactions[emoji] || 0), 0);
};

// Supported reactions configuration
export const POSITIVE_REACTIONS = ['👍', '❤️', '😂', '🔥', '👏'] as const;
export const NEGATIVE_REACTIONS = ['👎', '😡', '😢'] as const;
export const ALL_SUPPORTED_REACTIONS = [...POSITIVE_REACTIONS, ...NEGATIVE_REACTIONS] as const;

// Reaction metadata for future features
export const REACTION_META: Record<string, ReactionMeta> = {
  '👍': { emoji: '👍', type: 'positive' },
  '❤️': { emoji: '❤️', type: 'positive' },
  '😂': { emoji: '😂', type: 'positive' },
  '🔥': { emoji: '🔥', type: 'positive' },
  '👏': { emoji: '👏', type: 'positive' },
  '👎': { emoji: '👎', type: 'negative' },
  '😡': { emoji: '😡', type: 'negative' },
  '😢': { emoji: '😢', type: 'negative' },
};
