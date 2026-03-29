import { Poll } from '@/types/poll';

export const mockPolls: Poll[] = [
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
        votes: 45,
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
        votes: 32,
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
  },
  // Add more mock polls as needed
  {
    id: '2',
    title: 'Which programming language should I learn next?',
    description: 'Trying to decide on my next language to master',
    createdBy: 'dev456',
    createdAt: new Date('2023-12-28T15:30:00'),
    expiresAt: new Date('2024-01-10T23:59:59'),
    visibility: 'public',
    totalReactions: 42,
    views: 231,
    options: [
      {
        id: 'opt3',
        pollId: '2',
        title: 'TypeScript',
        imageUrl: 'https://picsum.photos/seed/typescript/400/300',
        votes: 67,
        reactions: { 
          '👏': 12, 
          '😄': 8,
          '❤️': 15,
          '🔥': 7,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0 
        },
        rank: 1
      },
      {
        id: 'opt4',
        pollId: '2',
        title: 'Rust',
        imageUrl: 'https://picsum.photos/seed/rust/400/300',
        votes: 43,
        reactions: { 
          '👏': 0, 
          '😄': 5,
          '❤️': 10,
          '🔥': 5,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0 
        },
        rank: 2
      },
      {
        id: 'opt5',
        pollId: '2',
        title: 'Go',
        imageUrl: 'https://picsum.photos/seed/golang/400/300',
        votes: 28,
        reactions: { 
          '👏': 0, 
          '😄': 2,
          '❤️': 5,
          '🔥': 3,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0 
        },
        rank: 3
      }
    ]
  }
];
