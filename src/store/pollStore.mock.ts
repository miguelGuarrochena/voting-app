import { create } from 'zustand';
import { Poll, PollOption, ReactionType } from '@/types/poll';
import { mockPolls } from '@/mock/polls';

// Helper function to create a new empty reaction count
const createEmptyReactions = (): Record<ReactionType, number> => ({
  '👏': 0,
  '😄': 0,
  '❤️': 0,
  '🔥': 0,
  '😡': 0,
  '🤮': 0,
  '🍅': 0,
  '😈': 0,
});

// Mock user ID for the current user
const MOCK_USER_ID = 'current-user-123';

// In-memory state for user reactions
let userReactionsState: Record<string, Record<string, ReactionType>> = {};

// Clone mock data to avoid mutating the original
const getMockPolls = () => JSON.parse(JSON.stringify(mockPolls)) as Poll[];

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
}

const usePollStore = create<PollStore>((set, get) => ({
  polls: getMockPolls(),
  filter: 'trending',
  currentPoll: null,
  userReactions: { ...userReactionsState },
  isLoading: false,

  setFilter: (filter) => set({ filter }),
  
  loadPolls: async () => {
    set({ isLoading: true });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    set({ polls: getMockPolls(), isLoading: false });
  },
  
  loadPoll: async (pollId: string) => {
    set({ isLoading: true });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const poll = getMockPolls().find(p => p.id === pollId) || null;
    set({ currentPoll: poll, isLoading: false });
  },
  
  reactToOption: (pollId, optionId, emoji) => {
    const { polls, currentPoll, userReactions } = get();
    
    // Update user reactions
    const currentReaction = userReactions[pollId]?.[optionId];
    const newUserReactions = { ...userReactions };
    
    if (!newUserReactions[pollId]) {
      newUserReactions[pollId] = {};
    }
    
    // Remove any existing reaction from the user for this poll
    Object.keys(newUserReactions[pollId]).forEach(optId => {
      if (newUserReactions[pollId][optId] === emoji) {
        delete newUserReactions[pollId][optId];
      }
    });
    
    // Toggle reaction
    if (currentReaction === emoji) {
      delete newUserReactions[pollId][optionId];
    } else {
      newUserReactions[pollId][optionId] = emoji;
    }
    
    // Update state
    userReactionsState = newUserReactions;
    set({ userReactions: { ...newUserReactions } });
  },
  
  removeReaction: (pollId, optionId) => {
    const { userReactions } = get();
    const newUserReactions = { ...userReactions };
    
    if (newUserReactions[pollId]?.[optionId]) {
      delete newUserReactions[pollId][optionId];
      // Clean up empty poll entries
      if (Object.keys(newUserReactions[pollId]).length === 0) {
        delete newUserReactions[pollId];
      }
      
      userReactionsState = newUserReactions;
      set({ userReactions: { ...newUserReactions } });
    }
  },
  
  createPoll: async (pollData) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPoll: Poll = {
      ...pollData,
      id: `poll-${Date.now()}`,
      createdAt: new Date(),
      totalReactions: 0,
      views: 0,
    };
    
    // In a real app, we would add this to the backend
    console.log('Creating poll:', newPoll);
    
    set({ isLoading: false });
    return newPoll;
  },
  
  addView: (pollId) => {
    // In a real app, this would increment the view count on the server
    console.log(`View recorded for poll ${pollId}`);
  },
}));

export default usePollStore;
