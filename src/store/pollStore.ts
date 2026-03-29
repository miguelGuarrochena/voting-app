import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Poll, PollOption, ReactionType, ReactionCount, UserReaction } from '@/types/poll';

// Helper function to create a new empty reaction count
const createEmptyReactions = (): ReactionCount => ({
  '👏': 0,
  '😄': 0,
  '❤️': 0,
  '🔥': 0,
  '😡': 0,
  '🤮': 0,
  '🍅': 0,
  '😈': 0,
});

// Mock data for development
const mockPolls: Poll[] = [
  {
    id: '1',
    title: 'Which outfit looks better for the party?',
    description: 'Help me decide what to wear tonight!',
    createdBy: 'user123',
    createdAt: new Date('2023-12-29T10:00:00'),
    expiresAt: new Date('2024-01-05T23:59:59'),
    visibility: 'public',
    totalReactions: 24,
    views: 156,
    options: [
      {
        id: 'opt1',
        pollId: '1',
        title: 'Casual look',
        imageUrl: 'https://picsum.photos/seed/outfit1/400/300',
        reactions: { 
          '👏': 8, 
          '😄': 5,
          '❤️': 0,
          '🔥': 0,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0 
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '1',
        title: 'Formal look',
        imageUrl: 'https://picsum.photos/seed/outfit2/400/300',
        reactions: { 
          '👏': 0, 
          '😄': 0,
          '❤️': 7,
          '🔥': 4,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0 
        },
        rank: 2
      }
    ]
  }
  // Add more mock polls as needed
];

interface PollStore {
  polls: Poll[];
  filter: 'trending' | 'recent' | 'expiring';
  setFilter: (filter: 'trending' | 'recent' | 'expiring') => void;
  loadPolls: () => Promise<void>;
  currentPoll: Poll | null;
  userReactions: Record<string, Record<string, ReactionType>>;
  isLoading: boolean;
  loadPoll: (pollId: string) => Promise<void>;
  reactToOption: (pollId: string, optionId: string, emoji: ReactionType) => void;
  removeReaction: (pollId: string, optionId: string) => void;
  createPoll: (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalReactions' | 'views'>) => Promise<Poll>;
  addView: (pollId: string) => void;
  getPollById: (pollId: string) => Poll | null;
}

// Create the store with a stable reference
const usePollStore = create<PollStore>((set, get) => ({
  // Initial state
  polls: mockPolls,
  filter: 'trending',
  currentPoll: null,
  userReactions: {},
  isLoading: false,

  // Actions
  setFilter: (filter) => set({ filter }),
  
  loadPolls: async () => {
    const { polls, isLoading } = get();
    
    // Prevent multiple simultaneous loads
    if (isLoading) {
      return;
    }
    
    // Skip if we already have polls (to prevent duplicates)
    if (polls.length > 0) {
      return;
    }
    
    try {
      set({ isLoading: true });
      // In a real app, this would be an API call
      // For now, we'll use a small timeout to simulate network request
      await new Promise(resolve => setTimeout(resolve, 100));
      set({ polls: mockPolls });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadPoll: async (pollId: string) => {
    // In a real app, this would be an API call
    const poll = mockPolls.find(p => p.id === pollId) || null;
    set({ currentPoll: poll });
    
    // Track view
    if (poll) {
      get().addView(pollId);
    }
  },
  
  createPoll: async (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalReactions' | 'views'>) => {
    // In a real app, this would be an API call
    const newPoll: Poll = {
      ...pollData,
      id: uuidv4(),
      createdAt: new Date(),
      totalReactions: 0,
      views: 0,
      options: pollData.options.map(opt => ({
        ...opt,
        reactions: createEmptyReactions(),
        rank: 0,
      })),
    };
    
    // Only update the store state, don't modify mockPolls
    set((state) => {
      // Check if poll with this ID already exists
      if (state.polls.some(poll => poll.id === newPoll.id)) {
        return state; // Don't add duplicate
      }
      return {
        polls: [newPoll, ...state.polls]
      };
    });
    
    return newPoll;
  },
  
  addView: (pollId: string) => {
    set(state => ({
      polls: state.polls.map(poll => 
        poll.id === pollId 
          ? { ...poll, views: (poll.views || 0) + 1 }
          : poll
      ),
      currentPoll: state.currentPoll?.id === pollId 
        ? { ...state.currentPoll, views: (state.currentPoll.views || 0) + 1 }
        : state.currentPoll
    }));
  },
  
  reactToOption: (pollId: string, optionId: string, emoji: ReactionType) => {
    const { currentPoll, polls, userReactions } = get();
    
    // Create a deep copy of the polls to modify
    const updatedPolls = [...polls];
    const pollIndex = updatedPolls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) return;
    
    const poll = { ...updatedPolls[pollIndex] };
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;
    
    const option = { ...poll.options[optionIndex] };
    
    // Check if user already reacted to this option
    const currentUserReaction = userReactions[pollId]?.[optionId];
    
    // Update reactions
    if (currentUserReaction && currentUserReaction !== emoji) {
      // Remove previous reaction
      option.reactions[currentUserReaction]--;
      poll.totalReactions--;
    } else if (currentUserReaction === emoji) {
      // Remove reaction if clicking the same emoji
      option.reactions[emoji]--;
      poll.totalReactions--;
      
      // Update UI state
      const updatedUserReactions = { ...userReactions };
      if (updatedUserReactions[pollId]) {
        delete updatedUserReactions[pollId][optionId];
        if (Object.keys(updatedUserReactions[pollId]).length === 0) {
          delete updatedUserReactions[pollId];
        }
      }
      
      // Update option in poll
      poll.options[optionIndex] = option;
      updatedPolls[pollIndex] = poll;
      
      set({
        polls: updatedPolls,
        currentPoll: currentPoll?.id === pollId ? { ...poll } : currentPoll,
        userReactions: updatedUserReactions
      });
      return;
    }
    
    // Add new reaction
    option.reactions[emoji] = (option.reactions[emoji] || 0) + 1;
    poll.totalReactions++;
    
    // Update option in poll
    poll.options[optionIndex] = option;
    updatedPolls[pollIndex] = poll;
    
    // Update user reactions
    const updatedUserReactions = {
      ...userReactions,
      [pollId]: {
        ...userReactions[pollId],
        [optionId]: emoji
      }
    };
    
    set({
      polls: updatedPolls,
      currentPoll: currentPoll?.id === pollId ? { ...poll } : currentPoll,
      userReactions: updatedUserReactions
    });
  },
  
  removeReaction: (pollId: string, optionId: string) => {
    const { currentPoll, polls, userReactions } = get();
    
    // Create a deep copy of the polls to modify
    const updatedPolls = [...polls];
    const pollIndex = updatedPolls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) return;
    
    const poll = { ...updatedPolls[pollIndex] };
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;
    
    const option = { ...poll.options[optionIndex] };
    const currentReaction = userReactions[pollId]?.[optionId];
    
    if (currentReaction) {
      // Remove the reaction
      option.reactions[currentReaction]--;
      poll.totalReactions--;
      
      // Update option in poll
      poll.options[optionIndex] = option;
      updatedPolls[pollIndex] = poll;
      
      // Update user reactions
      const updatedUserReactions = { ...userReactions };
      if (updatedUserReactions[pollId]) {
        delete updatedUserReactions[pollId][optionId];
        if (Object.keys(updatedUserReactions[pollId]).length === 0) {
          delete updatedUserReactions[pollId];
        }
      }
      
      set({
        polls: updatedPolls,
        currentPoll: currentPoll?.id === pollId ? { ...poll } : currentPoll,
        userReactions: updatedUserReactions
      });
    }
  },
  
  // Utility functions
  getTotalReactions: (reactions: ReactionCount): number => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  },
  
  getTopReaction: (reactions: ReactionCount): { emoji: string; count: number } | null => {
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
  },
  
  getPollById: (pollId: string) => get().polls.find(p => p.id === pollId) || null,
  isPositiveReaction: (emoji: ReactionType): boolean => {
    return ['👏', '😄', '❤️', '🔥'].includes(emoji);
  }
}));

export default usePollStore;

// Utility function to calculate total reactions for an option
export const getTotalReactions = (reactions: ReactionCount): number => {
  return Object.values(reactions).reduce((sum, count) => sum + count, 0);
};

// Utility function to get the top reaction for an option
export const getTopReaction = (reactions: ReactionCount): { emoji: string; count: number } | null => {
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

// Utility function to check if a reaction is positive
export const isPositiveReaction = (emoji: ReactionType): boolean => {
  return ['👏', '😄', '❤️', '🔥'].includes(emoji);
};
