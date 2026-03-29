import { Poll } from '@/types/poll';

export const mockPolls: Poll[] = [
  {
    id: '1',
    title: 'Which outfit for the costume party? 🎭',
    description: 'Help me choose the perfect costume for tonight\'s party!',
    createdBy: 'Sofia M.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    visibility: 'public',
    totalReactions: 156,
    views: 342,
    options: [
      {
        id: 'opt1',
        pollId: '1',
        title: 'Vampire',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80',
        reactions: {
          '👏': 28,
          '😄': 15,
          '❤️': 12,
          '🔥': 8,
          '😡': 2,
          '🤮': 1,
          '🍅': 0,
          '😈': 3
        },
        votes: 71,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '1',
        title: 'Witch',
        imageUrl: 'https://images.unsplash.com/photo-1574362848147-3d7b1966467e?w=600&q=80',
        reactions: {
          '👏': 18,
          '😄': 12,
          '❤️': 8,
          '🔥': 6,
          '😡': 1,
          '🤮': 0,
          '🍅': 1,
          '😈': 2
        },
        votes: 47,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '1',
        title: 'Superhero',
        imageUrl: 'https://images.unsplash.com/photo-1604053576264-d6996eea3a1d?w=600&q=80',
        reactions: {
          '👏': 12,
          '😄': 8,
          '❤️': 6,
          '🔥': 4,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 1
        },
        votes: 31,
        rank: 3
      }
    ]
  },
  {
    id: '2',
    title: 'Best summer destination? ✈️',
    description: 'Where should we go for our summer vacation?',
    createdBy: 'Alex R.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    visibility: 'public',
    totalReactions: 89,
    views: 234,
    options: [
      {
        id: 'opt1',
        pollId: '2',
        title: 'Miami',
        imageUrl: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=600&q=80',
        reactions: {
          '👏': 22,
          '😄': 18,
          '❤️': 8,
          '🔥': 12,
          '😡': 1,
          '🤮': 0,
          '🍅': 0,
          '😈': 2
        },
        votes: 61,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '2',
        title: 'Bali',
        imageUrl: 'https://images.unsplash.com/photo-1518548419970-5823dfd2cd30?w=600&q=80',
        reactions: {
          '👏': 15,
          '😄': 12,
          '❤️': 6,
          '🔥': 8,
          '😡': 0,
          '🤮': 1,
          '🍅': 0,
          '😈': 1
        },
        votes: 42,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '2',
        title: 'Barcelona',
        imageUrl: 'https://images.unsplash.com/photo-1583894217816-65e281134209?w=600&q=80',
        reactions: {
          '👏': 8,
          '😄': 6,
          '❤️': 4,
          '🔥': 3,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 21,
        rank: 3
      }
    ]
  },
  {
    id: '3',
    title: 'Pizza vs Sushi vs Tacos 🍕🍣🌮',
    description: 'The ultimate food debate - what\'s your favorite?',
    createdBy: 'Carlos V.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    visibility: 'public',
    totalReactions: 267,
    views: 512,
    options: [
      {
        id: 'opt1',
        pollId: '3',
        title: 'Pizza 🍕',
        reactions: {
          '👏': 45,
          '😄': 38,
          '❤️': 28,
          '🔥': 22,
          '😡': 3,
          '🤮': 2,
          '🍅': 1,
          '😈': 4
        },
        votes: 143,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '3',
        title: 'Sushi 🍣',
        reactions: {
          '👏': 32,
          '😄': 28,
          '❤️': 24,
          '🔥': 18,
          '😡': 2,
          '🤮': 1,
          '🍅': 0,
          '😈': 2
        },
        votes: 107,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '3',
        title: 'Tacos 🌮',
        reactions: {
          '👏': 18,
          '😄': 15,
          '❤️': 12,
          '🔥': 8,
          '😡': 1,
          '🤮': 0,
          '🍅': 0,
          '😈': 1
        },
        votes: 54,
        rank: 3
      }
    ]
  },
  {
    id: '4',
    title: 'Which movie deserves the Oscar? 🎬',
    description: 'Vote for the best film of the year!',
    createdBy: 'Emma W.',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    visibility: 'public',
    totalReactions: 198,
    views: 445,
    options: [
      {
        id: 'opt1',
        pollId: '4',
        title: 'Drama Masterpiece',
        imageUrl: 'https://images.unsplash.com/photo-1489599809568-352b6a1a5a8c?w=600&q=80',
        reactions: {
          '👏': 35,
          '😄': 28,
          '❤️': 22,
          '🔥': 18,
          '😡': 2,
          '🤮': 1,
          '🍅': 0,
          '😈': 3
        },
        votes: 125,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '4',
        title: 'Action Thriller',
        imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d2abc40?w=600&q=80',
        reactions: {
          '👏': 28,
          '😄': 22,
          '❤️': 18,
          '🔥': 15,
          '😡': 1,
          '🤮': 0,
          '🍅': 1,
          '😈': 2
        },
        votes: 88,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '4',
        title: 'Sci-Fi Epic',
        imageUrl: 'https://images.unsplash.com/photo-1485949023787-4c3125afaccc?w=600&q=80',
        reactions: {
          '👏': 18,
          '😄': 15,
          '❤️': 12,
          '🔥': 8,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 1
        },
        votes: 53,
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '4',
        title: 'Comedy Hit',
        imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80',
        reactions: {
          '👏': 12,
          '😄': 8,
          '❤️': 6,
          '🔥': 4,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 30,
        rank: 4
      }
    ]
  },
  {
    id: '5',
    title: 'Best workout for summer body? 💪',
    description: 'What\'s the most effective exercise routine?',
    createdBy: 'Jake F.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (ENDED)
    visibility: 'public',
    totalReactions: 145,
    views: 298,
    options: [
      {
        id: 'opt1',
        pollId: '5',
        title: 'Running',
        reactions: {
          '👏': 42,
          '😄': 35,
          '❤️': 28,
          '🔥': 22,
          '😡': 1,
          '🤮': 0,
          '🍅': 0,
          '😈': 2
        },
        votes: 130,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '5',
        title: 'Weight Training',
        reactions: {
          '👏': 18,
          '😄': 15,
          '❤️': 12,
          '🔥': 8,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 1
        },
        votes: 44,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '5',
        title: 'Yoga',
        reactions: {
          '👏': 12,
          '😄': 8,
          '❤️': 6,
          '🔥': 4,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 30,
        rank: 3
      }
    ]
  },
  {
    id: '6',
    title: 'Morning coffee or matcha? ☕',
    description: 'What\'s your favorite morning beverage?',
    createdBy: 'Yuki T.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (ENDED)
    visibility: 'public',
    totalReactions: 78,
    views: 167,
    options: [
      {
        id: 'opt1',
        pollId: '6',
        title: 'Coffee ☕',
        reactions: {
          '👏': 18,
          '😄': 15,
          '❤️': 12,
          '🔥': 8,
          '😡': 1,
          '🤮': 0,
          '🍅': 0,
          '😈': 1
        },
        votes: 55,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '6',
        title: 'Matcha 🍵',
        reactions: {
          '👏': 17,
          '😄': 14,
          '❤️': 11,
          '🔥': 7,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 1
        },
        votes: 50,
        rank: 2
      }
    ]
  },
  {
    id: '7',
    title: 'New office design — which vibe? 🏢',
    description: 'Help us choose the style for our new office space!',
    createdBy: 'Marco P.',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    visibility: 'private',
    totalReactions: 34,
    views: 78,
    options: [
      {
        id: 'opt1',
        pollId: '7',
        title: 'Modern Minimalist',
        imageUrl: 'https://images.unsplash.com/photo-1497366214047-f369c0f1a4c5?w=600&q=80',
        reactions: {
          '👏': 8,
          '😄': 6,
          '❤️': 4,
          '🔥': 3,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 21,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '7',
        title: 'Industrial Chic',
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
        reactions: {
          '👏': 6,
          '😄': 4,
          '❤️': 3,
          '🔥': 2,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 15,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '7',
        title: 'Cozy Traditional',
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',
        reactions: {
          '👏': 4,
          '😄': 2,
          '❤️': 2,
          '🔥': 1,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 9,
        rank: 3
      }
    ]
  },
  {
    id: '8',
    title: 'Weekend plans vote 🎉',
    description: 'What should we do this weekend?',
    createdBy: 'You',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    visibility: 'public',
    totalReactions: 0,
    views: 12,
    options: [
      {
        id: 'opt1',
        pollId: '8',
        title: 'Beach Day',
        reactions: {
          '👏': 0,
          '😄': 0,
          '❤️': 0,
          '🔥': 0,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 0,
        rank: 0
      },
      {
        id: 'opt2',
        pollId: '8',
        title: 'Hiking Trip',
        reactions: {
          '👏': 0,
          '😄': 0,
          '❤️': 0,
          '🔥': 0,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 0,
        rank: 0
      },
      {
        id: 'opt3',
        pollId: '8',
        title: 'City Exploration',
        reactions: {
          '👏': 0,
          '😄': 0,
          '❤️': 0,
          '🔥': 0,
          '😡': 0,
          '🤮': 0,
          '🍅': 0,
          '😈': 0
        },
        votes: 0,
        rank: 0
      }
    ]
  }
];

// Helper function to get creator avatar initials
export const getCreatorAvatar = (creatorName: string): string => {
  const names = creatorName.split(' ');
  if (names.length >= 2) {
    return names[0][0] + names[names.length - 1][0];
  }
  return names[0].slice(0, 2).toUpperCase();
};
