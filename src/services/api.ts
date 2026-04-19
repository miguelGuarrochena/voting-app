import { Poll, PollOption, createEmptyReactions } from '@/types/poll';
import { v4 as uuidv4 } from 'uuid';
import { defaultPolls, initializeDefaultPolls } from '@/data/defaultPolls';

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

// Generate realistic mock polls
const generateMockPolls = (): Poll[] => {
  const pollTemplates = [
    {
      title: "Best programming language for beginners?",
      description: "What's your recommendation for someone starting their coding journey?",
      options: ["Python", "JavaScript", "Java", "C#", "Go"]
    },
    {
      title: "Preferred work environment",
      description: "Where do you work most productively?",
      options: ["Office", "Home", "Hybrid", "Co-working space", "Cafe"]
    },
    {
      title: "Morning routine essential",
      description: "What's the one thing you can't start your day without?",
      options: ["Coffee", "Exercise", "Meditation", "Reading", "Music"]
    },
    {
      title: "Best way to learn new skills",
      description: "What's your preferred learning method?",
      options: ["Video tutorials", "Books", "Hands-on practice", "Mentorship", "Courses"]
    },
    {
      title: "Favorite type of break",
      description: "How do you recharge during work breaks?",
      options: ["Short walk", "Social media", "Chat with colleagues", "Listen to music", "Power nap"]
    },
    {
      title: "Ideal team size",
      description: "What's the perfect team size for productivity?",
      options: ["2-3 people", "4-6 people", "7-10 people", "11-15 people", "16+ people"]
    },
    {
      title: "Best time for deep work",
      description: "When are you most productive?",
      options: ["Early morning", "Late morning", "Afternoon", "Evening", "Late night"]
    },
    {
      title: "Preferred meeting length",
      description: "What's the ideal meeting duration?",
      options: ["15 minutes", "30 minutes", "45 minutes", "1 hour", "As long as needed"]
    }
  ];

  const now = new Date();
  
  return pollTemplates.map((template, index) => {
    const expiresAt = new Date(now.getTime() + (index + 1) * 24 * 60 * 60 * 1000); // 1-8 days from now
    const createdAt = new Date(now.getTime() - index * 2 * 60 * 60 * 1000); // Created in past
    
    const options: PollOption[] = template.options.map((title, optionIndex) => ({
      id: uuidv4(),
      pollId: '',
      title,
      votes: Math.floor(Math.random() * 50) + 5, // 5-54 votes
      reactions: createEmptyReactions(),
      rank: optionIndex + 1,
      imageUrl: Math.random() > 0.7 ? `https://picsum.photos/seed/${title.replace(/\s+/g, '')}/400/300.jpg` : undefined
    }));

    // Add some random reactions
    options.forEach(option => {
      const reactionCount = Math.floor(Math.random() * 8);
      const reactions = ['👍', '❤️', '😄', '🔥', '👏', '🎉', '😊', '👌'];
      for (let i = 0; i < reactionCount; i++) {
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        option.reactions[reaction] = Math.floor(Math.random() * 3) + 1;
      }
    });

    return {
      id: uuidv4(),
      title: template.title,
      description: template.description,
      titleImage: Math.random() > 0.6 ? `https://picsum.photos/seed/poll${index}/800/400.jpg` : undefined,
      expiresAt,
      createdAt,
      isPublic: true,
      visibility: 'public' as const,
      createdBy: `user${index + 1}`,
      totalReactions: options.reduce((sum, opt) => sum + Object.values(opt.reactions).reduce((a, b) => a + b, 0), 0),
      views: Math.floor(Math.random() * 200) + 20,
      options
    };
  });
};

// Initialize mock data with default polls
const initializeMockData = (): Poll[] => {
  return initializeDefaultPolls();
};

// API Service
export const pollApi = {
  // Get all polls
  getPolls: async (): Promise<ApiResponse<Poll[]>> => {
    const polls = storage.get<Poll>('polls');
    // Siempre asegurar que haya polls disponibles
    const availablePolls = polls.length > 0 ? polls : initializeDefaultPolls();
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

// Initialize data on import
initializeMockData();

// Ensure default polls are always available
if (typeof window !== 'undefined') {
  const currentPolls = storage.get<Poll>('polls');
  if (currentPolls.length === 0) {
    initializeMockData();
  }
}
