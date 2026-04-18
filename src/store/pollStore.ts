import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Poll, PollOption, ReactionCount, UserReaction, UserVote, createEmptyReactions } from '@/types/poll';
import { initializeDefaultPolls } from '@/data/defaultPolls';

// Helper function to create a new empty reaction count
const createEmptyReactionsLocal = (): ReactionCount => ({});

interface PollStore {
  polls: Poll[];
  filter: 'trending' | 'recent' | 'expiring';
  setFilter: (filter: 'trending' | 'recent' | 'expiring') => void;
  loadPolls: () => Promise<void>;
  currentPoll: Poll | null;
  userReactions: Record<string, Record<string, string>>;
  userVotes: Record<string, string>; // pollId -> optionId
  userRankings: Record<string, Record<string, string[]>>; // pollId -> userId -> rankedOptionIds
  isLoading: boolean;
  loadPoll: (pollId: string) => Promise<void>;
  reactToOption: (pollId: string, optionId: string, emoji: string) => void;
  removeReaction: (pollId: string, optionId: string) => void;
  voteOnOption: (pollId: string, optionId: string) => void;
  createPoll: (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalReactions' | 'views'>) => Promise<Poll>;
  addView: (pollId: string) => void;
  getPollById: (pollId: string) => Poll | null;
  getMyPolls: (userId: string) => Poll[];
  getPrivatePolls: (userId: string) => Poll[];
  rankOptions: (pollId: string, userId: string, rankedOptionIds: string[]) => void;
  inviteUserToPoll: (pollId: string, userId: string) => void;
  canUserAccessPoll: (pollId: string, userId: string) => boolean;
  getPollByInviteToken: (token: string) => Poll | undefined;
}

// Create the store with localStorage persistence
const usePollStore = create<PollStore>()(
  persist(
    (set, get) => ({
      // Initial state - load from localStorage to match API
      polls: typeof window !== 'undefined' ? initializeDefaultPolls() : [],
      filter: 'trending',
      currentPoll: null,
      userReactions: {},
      userVotes: {},
      userRankings: {},
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
          set({ polls: initializeDefaultPolls() });
        } finally {
          set({ isLoading: false });
        }
      },
      
      loadPoll: async (pollId: string) => {
        // In a real app, this would be an API call
        const poll = initializeDefaultPolls().find((p: Poll) => p.id === pollId) || null;
        set({ currentPoll: poll });

        // Track view
        if (poll) {
          get().addView(pollId);
        }
      },

      voteOnOption: (pollId: string, optionId: string) => {
        const { currentPoll, polls, userVotes } = get();
        
        // Create a deep copy of the polls to modify
        const updatedPolls = [...polls];
        const pollIndex = updatedPolls.findIndex(p => p.id === pollId);
        if (pollIndex === -1) return;
        
        const poll = { ...updatedPolls[pollIndex] };
        
        // Check if user already voted
        const previousVote = userVotes[pollId];
        
        // Update votes
        const updatedOptions = poll.options.map(option => {
          if (option.id === optionId) {
            return { ...option, votes: option.votes + 1 };
          }
          if (previousVote && option.id === previousVote) {
            return { ...option, votes: Math.max(0, option.votes - 1) };
          }
          return option;
        });
        
        poll.options = updatedOptions;
        updatedPolls[pollIndex] = poll;
        
        // Update user votes
        const updatedUserVotes = {
          ...userVotes,
          [pollId]: optionId
        };
        
        set({
          polls: updatedPolls,
          currentPoll: currentPoll?.id === pollId ? { ...poll } : currentPoll,
          userVotes: updatedUserVotes
        });
      },
      
      createPoll: async (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalReactions' | 'views'>) => {
        // In a real app, this would be an API call
        const isPrivate = pollData.isPrivate ?? false;
        const inviteToken = isPrivate ? Math.random().toString(36).substring(2, 10) : undefined;

        const newPoll: Poll = {
          ...pollData,
          id: uuidv4(),
          createdAt: new Date(),
          totalReactions: 0,
          views: 0,
          type: pollData.type ?? 'vote',
          isPrivate: isPrivate,
          invitedUsers: pollData.invitedUsers ?? [],
          inviteToken: inviteToken,
          options: pollData.options.map(opt => ({
            ...opt,
            reactions: createEmptyReactionsLocal(),
            votes: 0,
            rank: 0,
          })),
        };
        
        // Only update the store state, don't modify default polls
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
      
      reactToOption: (pollId: string, optionId: string, emoji: string) => {
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
        
        // Add new reaction safely
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
        return (Object.values(reactions) as number[]).reduce((sum, count) => sum + count, 0);
      },
      
      getTopReaction: (reactions: ReactionCount): { emoji: string; count: number } | null => {
        const entries = Object.entries(reactions);
        if (entries.length === 0) return null;
        
        let topEmoji = '';
        let topCount = -1;
        
        for (const [emoji, count] of entries) {
          if ((count as number) > topCount) {
            topEmoji = emoji;
            topCount = count as number;
          }
        }
        
        return topCount > 0 ? { emoji: topEmoji, count: topCount } : null;
      },
      
      getPollById: (pollId: string) => get().polls.find(p => p.id === pollId) || null,
      
      getMyPolls: (userId: string) => {
        return get().polls.filter(poll => poll.createdBy === userId);
      },
      
      getPrivatePolls: (userId: string) => {
        return get().polls.filter(poll => poll.isPrivate === true && poll.createdBy === userId);
      },
      
      rankOptions: (pollId: string, userId: string, rankedOptionIds: string[]) => {
        set(state => ({
          userRankings: {
            ...state.userRankings,
            [pollId]: {
              ...state.userRankings[pollId],
              [userId]: rankedOptionIds
            }
          }
        }));
      },

      inviteUserToPoll: (pollId: string, userId: string) => {
        set(state => {
          const poll = state.polls.find(p => p.id === pollId);
          if (!poll) return state;

          const invitedUsers = poll.invitedUsers || [];
          if (invitedUsers.includes(userId)) return state;

          const updatedPolls = state.polls.map(p =>
            p.id === pollId
              ? { ...p, invitedUsers: [...invitedUsers, userId] }
              : p
          );

          return {
            polls: updatedPolls,
            currentPoll: state.currentPoll?.id === pollId
              ? { ...state.currentPoll, invitedUsers: [...invitedUsers, userId] }
              : state.currentPoll
          };
        });
      },

      canUserAccessPoll: (pollId: string, userId: string) => {
        const poll = get().polls.find(p => p.id === pollId);
        if (!poll) return false;

        // If poll is not private, everyone can access
        if (!poll.isPrivate) return true;

        // Creator always has access
        if (poll.createdBy === userId) return true;

        // Check if user is in invited list
        if (poll.invitedUsers?.includes(userId)) return true;

        return false;
      },

      getPollByInviteToken: (token: string) => {
        return get().polls.find(p => p.inviteToken === token);
      },

      isPositiveReaction: (emoji: string): boolean => {
        return ['👏', '😄', '❤️', '🔥'].includes(emoji);
      }
    }),
    {
      name: 'poll-store',
      partialize: (state) => ({
        userReactions: state.userReactions,
        userVotes: state.userVotes,
        userRankings: state.userRankings,
      }),
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const item = localStorage.getItem(name);
          if (!item) return null;
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default usePollStore;

// Utility function to calculate total reactions for an option
export const getTotalReactions = (reactions: ReactionCount): number => {
  return (Object.values(reactions) as number[]).reduce((sum, count) => sum + count, 0);
};

// Utility function to get the top reaction for an option
export const getTopReaction = (reactions: ReactionCount): { emoji: string; count: number } | null => {
  const entries = Object.entries(reactions);
  if (entries.length === 0) return null;
  
  let topEmoji = '';
  let topCount = -1;
  
  for (const [emoji, count] of entries) {
    if ((count as number) > topCount) {
      topEmoji = emoji;
      topCount = count as number;
    }
  }
  
  return topCount > 0 ? { emoji: topEmoji, count: topCount } : null;
};

// Utility function to check if a reaction is positive
export const isPositiveReaction = (emoji: string): boolean => {
  return ['👏', '😄', '❤️', '🔥'].includes(emoji);
};
