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
  addPoll: (poll: Omit<Poll, 'id' | 'createdAt'>) => void;
  voteOnOption: (pollId: string, optionId: string, emoji: string) => void;
};

const MOCK_POLLS: Poll[] = [
  {
    id: '1',
    title: 'Which outfit looks better?',
    description: 'Help me decide for the party tonight!',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
    createdBy: 'user1',
    createdAt: new Date().toISOString(),
    options: [
      {
        id: '1-1',
        label: 'Casual Look',
        image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500&auto=format&fit=crop',
        reactions: { '👍': 12, '❤️': 8 },
      },
      {
        id: '1-2',
        label: 'Formal Look',
        image: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500&auto=format&fit=crop',
        reactions: { '👍': 5, '❤️': 15 },
      },
    ],
  },
  {
    id: '2',
    title: 'Best Halloween Costume',
    description: 'Which one should I wear for the contest?',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
    createdBy: 'user2',
    createdAt: new Date().toISOString(),
    options: [
      {
        id: '2-1',
        label: 'Superhero',
        image: 'https://images.unsplash.com/photo-1518364538800-6bae3c2ea0f2?w=500&auto=format&fit=crop',
        reactions: { '😎': 7, '👏': 3 },
      },
      {
        id: '2-2',
        label: 'Zombie',
        image: 'https://images.unsplash.com/photo-1508361001413-7a9daf21c0c4?w=500&auto=format&fit=crop',
        reactions: { '😱': 10, '👻': 8 },
      },
      {
        id: '2-3',
        label: 'Vampire',
        image: 'https://images.unsplash.com/photo-1508361001413-7a9daf21c0c4?w=500&auto=format&fit=crop',
        reactions: { '🧛': 15, '😈': 5 },
      },
    ],
  },
];

export const usePollStore = create<PollStore>((set) => ({
  polls: MOCK_POLLS,
  
  addPoll: (poll) =>
    set((state) => ({
      polls: [
        ...state.polls,
        {
          ...poll,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  voteOnOption: (pollId, optionId, emoji) =>
    set((state) => ({
      polls: state.polls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      reactions: {
                        ...option.reactions,
                        [emoji]: (option.reactions[emoji] || 0) + 1,
                      },
                    }
                  : option
              ),
            }
          : poll
      ),
    })),
}));

export default usePollStore;
