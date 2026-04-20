import { Poll, PollOption, createEmptyReactions } from '@/types/poll';
import { v4 as uuidv4 } from 'uuid';

export interface ApiConfig {
  delay?: number;
  forceError?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

/**
 * Generic API call simulator with configurable delay and error handling
 * No random failures - only explicit errors via config
 */
export const simulateApiCall = async <T>(
  data: T,
  config: ApiConfig = {}
): Promise<ApiResponse<T>> => {
  const { delay = 600, forceError = false } = config;
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Only fail if explicitly requested
  if (forceError) {
    throw new Error('API Error: Request failed');
  }
  
  return {
    data,
    success: true
  };
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get: <T>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return [];
    }
  },
  
  set: <T>(key: string, data: T[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  },
  
  getSingle: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return null;
    }
  },
  
  setSingle: <T>(key: string, data: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  }
};


// API Service
export const pollApi = {
  // Get all polls
  getPolls: async (): Promise<ApiResponse<Poll[]>> => {
    const polls = storage.get<Poll>('polls');
    // Polls are now loaded from Supabase in individual pages
    const availablePolls = polls.length > 0 ? polls : [];
    return simulateApiCall(availablePolls);
  },

  // Get poll by ID
  getPollById: async (pollId: string): Promise<ApiResponse<Poll | null>> => {
    const polls = storage.get<Poll>('polls');
    const poll = polls.find((p: Poll) => p.id === pollId) || null;
    
    if (poll) {
      // Increment views
      poll.views = (poll.views || 0) + 1;
      const updatedPolls = polls.map((p: Poll) => p.id === pollId ? poll : p);
      storage.set('polls', updatedPolls);
    }
    
    return simulateApiCall(poll);
  },

  // Create new poll
  createPoll: async (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalReactions' | 'views'>): Promise<ApiResponse<Poll>> => {
    const polls = storage.get<Poll>('polls');

    // Validate expiration date - max 7 days from creation
    const now = new Date();
    const maxExpiration = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const expiresAt = new Date(pollData.expiresAt);

    if (expiresAt > maxExpiration) {
      throw new Error('Poll expiration cannot exceed 7 days from creation');
    }

    const newPoll: Poll = {
      ...pollData,
      id: uuidv4(),
      createdAt: now,
      totalReactions: 0,
      views: 0,
      options: pollData.options.map(opt => ({
        ...opt,
        reactions: createEmptyReactions(),
        votes: 0,
        rank: 0,
      })),
    };

    const updatedPolls = [newPoll, ...polls];
    storage.set('polls', updatedPolls);

    return simulateApiCall(newPoll);
  },

  // Vote on option
  voteOnOption: async (pollId: string, optionId: string): Promise<ApiResponse<Poll>> => {
    const polls = storage.get<Poll>('polls');
    const pollIndex = polls.findIndex((p: Poll) => p.id === pollId);
    
    if (pollIndex === -1) {
      throw new Error('Poll not found');
    }
    
    const poll = { ...polls[pollIndex] };
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    
    if (optionIndex === -1) {
      throw new Error('Option not found');
    }
    
    // Update vote count
    poll.options[optionIndex].votes += 1;
    polls[pollIndex] = poll;
    storage.set('polls', polls);
    
    return simulateApiCall(poll);
  },

  // Add reaction
  reactToOption: async (pollId: string, optionId: string, emoji: string): Promise<ApiResponse<Poll>> => {
    const polls = storage.get<Poll>('polls');
    const pollIndex = polls.findIndex((p: Poll) => p.id === pollId);
    
    if (pollIndex === -1) {
      throw new Error('Poll not found');
    }
    
    const poll = { ...polls[pollIndex] };
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    
    if (optionIndex === -1) {
      throw new Error('Option not found');
    }
    
    // Update reaction count
    const option = poll.options[optionIndex];
    option.reactions[emoji] = (option.reactions[emoji] || 0) + 1;
    poll.totalReactions += 1;
    
    polls[pollIndex] = poll;
    storage.set('polls', polls);
    
    return simulateApiCall(poll);
  },

  // Remove reaction
  removeReaction: async (pollId: string, optionId: string, emoji: string): Promise<ApiResponse<Poll>> => {
    const polls = storage.get<Poll>('polls');
    const pollIndex = polls.findIndex((p: Poll) => p.id === pollId);
    
    if (pollIndex === -1) {
      throw new Error('Poll not found');
    }
    
    const poll = { ...polls[pollIndex] };
    const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
    
    if (optionIndex === -1) {
      throw new Error('Option not found');
    }
    
    // Update reaction count
    const option = poll.options[optionIndex];
    if (option.reactions[emoji] > 0) {
      option.reactions[emoji] -= 1;
      poll.totalReactions -= 1;
    }
    
    polls[pollIndex] = poll;
    storage.set('polls', polls);
    
    return simulateApiCall(poll);
  },

  // Delete poll (for cleanup)
  deletePoll: async (pollId: string): Promise<ApiResponse<void>> => {
    const polls = storage.get<Poll>('polls');
    const filteredPolls = polls.filter((p: Poll) => p.id !== pollId);
    storage.set('polls', filteredPolls);
    return simulateApiCall(undefined as any);
  }
};
