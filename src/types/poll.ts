import { Poll as StorePoll } from '../store/usePollStore';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  emoji: string;
  image?: string;
}

export interface Author {
  id: string;
  name: string;
  avatar: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Date;
  expiresAt: Date;
  author: Author;
  totalVotes: number;
  isPublic: boolean;
  isExpired?: boolean;
}

// Utility function to convert store poll to UI poll
export function mapStorePollToUIPoll(storePoll: StorePoll): Poll {
  const now = new Date();
  const expiresAt = new Date(storePoll.expiresAt);
  
  return {
    id: storePoll.id,
    question: storePoll.title,
    options: storePoll.options.map(option => ({
      id: option.id,
      text: option.label,
      votes: Object.values(option.reactions).reduce((sum, count) => sum + count, 0),
      emoji: Object.keys(option.reactions)[0] || '👍',
      image: option.image
    })),
    createdAt: new Date(storePoll.createdAt),
    expiresAt,
    isExpired: expiresAt < now,
    author: {
      id: storePoll.createdBy,
      name: storePoll.createdBy,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(storePoll.createdBy)}&background=random`
    },
    totalVotes: storePoll.options.reduce(
      (sum, option) => sum + Object.values(option.reactions).reduce((a, b) => a + b, 0),
      0
    ),
    isPublic: storePoll.isPublic
  };
}
