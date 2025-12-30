import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

type Reaction = {
  [emoji: string]: number;
};

type PollOption = {
  id: string;
  label: string;
  image: string;
  reactions: Reaction;
};

export type Poll = {
  id: string;
  title: string;
  description?: string;
  expiresAt: string;
  isPublic: boolean;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
};

type PollStore = {
  polls: Poll[];
  addPoll: (poll: Omit<Poll, 'id' | 'createdAt' | 'createdBy'>) => void;
  voteOnOption: (pollId: string, optionId: string, emoji: string) => void;
  getPollById: (id: string) => Poll | undefined;
};

export const usePollStore = create<PollStore>((set, get) => ({
  polls: [],
  
  addPoll: (poll) =>
    set((state) => {
      const newPoll: Poll = {
        ...poll,
        id: uuidv4(),
        createdBy: 'current-user', // In a real app, this would be the logged-in user
        createdAt: new Date().toISOString(),
        options: poll.options.map(option => ({
          ...option,
          reactions: {},
        })),
      };
      
      return {
        polls: [...state.polls, newPoll],
      };
    }),
    
  voteOnOption: (pollId, optionId, emoji) =>
    set((state) => ({
      polls: state.polls.map((poll) => {
        if (poll.id !== pollId) return poll;
        
        return {
          ...poll,
          options: poll.options.map((option) => {
            if (option.id !== optionId) return option;
            
            const currentCount = option.reactions[emoji] || 0;
            return {
              ...option,
              reactions: {
                ...option.reactions,
                [emoji]: currentCount + 1,
              },
            };
          }),
        };
      }),
    })),
    
  getPollById: (id) => {
    return get().polls.find((poll) => poll.id === id);
  },
}));

export default usePollStore;
