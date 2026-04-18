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
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 28,
          '❤️': 12,
          '😂': 8,
          '🔥': 15,
          '👎': 2,
          '😡': 3
        },
        votes: 71,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '1',
        title: 'Witch',
        imageUrl: 'https://images.unsplash.com/photo-1574362848147-3d7b1966467e?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 18,
          '❤️': 8,
          '😂': 6,
          '🔥': 12,
          '👎': 1,
          '😡': 2
        },
        votes: 47,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '1',
        title: 'Superhero',
        imageUrl: 'https://images.unsplash.com/photo-1604053576264-d6996eea3a1d?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 12,
          '❤️': 6,
          '😂': 4,
          '🔥': 8,
          '👎': 0,
          '😡': 1
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
        imageUrl: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 22,
          '❤️': 8,
          '😂': 12,
          '🔥': 18,
          '👎': 1,
          '😡': 2
        },
        votes: 61,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '2',
        title: 'Bali',
        imageUrl: 'https://images.unsplash.com/photo-1518548419970-5823dfd2cd30?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 15,
          '❤️': 6,
          '😂': 8,
          '🔥': 12,
          '👎': 0,
          '😡': 1
        },
        votes: 42,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '2',
        title: 'Barcelona',
        imageUrl: 'https://images.unsplash.com/photo-1583894217816-65e281134209?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 8,
          '❤️': 4,
          '😂': 3,
          '🔥': 6,
          '👎': 0,
          '😡': 0
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
          '👍': 45,
          '❤️': 28,
          '😂': 22,
          '🔥': 38,
          '👎': 3,
          '😡': 4
        },
        votes: 143,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '3',
        title: 'Sushi 🍣',
        reactions: {
          '👍': 32,
          '❤️': 24,
          '😂': 18,
          '🔥': 28,
          '👎': 2,
          '😡': 2
        },
        votes: 107,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '3',
        title: 'Tacos 🌮',
        reactions: {
          '👍': 18,
          '❤️': 12,
          '😂': 8,
          '🔥': 15,
          '👎': 1,
          '😡': 1
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
        imageUrl: 'https://images.unsplash.com/photo-1489599809568-352b6a1a5a8c?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 35,
          '❤️': 22,
          '😂': 18,
          '🔥': 28,
          '👎': 2,
          '😡': 3
        },
        votes: 125,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '4',
        title: 'Action Thriller',
        imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d2abc40?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 28,
          '❤️': 18,
          '😂': 15,
          '🔥': 22,
          '👎': 1,
          '😡': 2
        },
        votes: 88,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '4',
        title: 'Sci-Fi Epic',
        imageUrl: 'https://images.unsplash.com/photo-1485949023787-4c3125afaccc?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 18,
          '❤️': 12,
          '😂': 8,
          '🔥': 15,
          '👎': 0,
          '😡': 1
        },
        votes: 53,
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '4',
        title: 'Comedy Hit',
        imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 12,
          '❤️': 6,
          '😂': 4,
          '🔥': 8,
          '👎': 0,
          '😡': 0
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
          '👍': 42,
          '❤️': 28,
          '😂': 22,
          '🔥': 35,
          '👎': 1,
          '😡': 2
        },
        votes: 130,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '5',
        title: 'Weight Training',
        reactions: {
          '👍': 18,
          '❤️': 12,
          '😂': 8,
          '🔥': 15,
          '👎': 0,
          '😡': 1
        },
        votes: 44,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '5',
        title: 'Yoga',
        reactions: {
          '👍': 12,
          '❤️': 6,
          '😂': 4,
          '🔥': 8,
          '👎': 0,
          '😡': 0
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
          '👍': 18,
          '❤️': 12,
          '😂': 8,
          '🔥': 15,
          '👎': 1,
          '😡': 1
        },
        votes: 55,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '6',
        title: 'Matcha 🍵',
        reactions: {
          '👍': 17,
          '❤️': 11,
          '😂': 7,
          '🔥': 14,
          '👎': 0,
          '😡': 1
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
        imageUrl: 'https://images.unsplash.com/photo-1497366214047-f369c0f1a4c5?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 8,
          '❤️': 4,
          '😂': 3,
          '🔥': 6,
          '👎': 0,
          '😡': 0
        },
        votes: 21,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '7',
        title: 'Industrial Chic',
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 6,
          '❤️': 3,
          '😂': 2,
          '🔥': 4,
          '👎': 0,
          '😡': 0
        },
        votes: 15,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '7',
        title: 'Cozy Traditional',
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 4,
          '❤️': 2,
          '😂': 1,
          '🔥': 2,
          '👎': 0,
          '😡': 0
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
          '👍': 0,
          '❤️': 0,
          '😂': 0,
          '🔥': 0,
          '👎': 0,
          '😡': 0
        },
        votes: 0,
        rank: 0
      },
      {
        id: 'opt2',
        pollId: '8',
        title: 'Hiking Trip',
        reactions: {
          '👍': 0,
          '❤️': 0,
          '😂': 0,
          '🔥': 0,
          '👎': 0,
          '😡': 0
        },
        votes: 0,
        rank: 0
      },
      {
        id: 'opt3',
        pollId: '8',
        title: 'City Exploration',
        reactions: {
          '👍': 0,
          '❤️': 0,
          '😂': 0,
          '🔥': 0,
          '👎': 0,
          '😡': 0
        },
        votes: 0,
        rank: 0
      }
    ]
  },
  {
    id: '9',
    title: 'Best programming language for beginners? 💻',
    description: 'Which language should new developers learn first?',
    createdBy: 'Tech Team',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    visibility: 'public',
    totalReactions: 245,
    views: 523,
    options: [
      {
        id: 'opt1',
        pollId: '9',
        title: 'Python',
        imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 45,
          '❤️': 32,
          '😂': 8,
          '🔥': 38,
          '👎': 2,
          '😡': 1
        },
        votes: 126,
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '9',
        title: 'JavaScript',
        imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 38,
          '❤️': 28,
          '😂': 12,
          '🔥': 32,
          '👎': 3,
          '😡': 2
        },
        votes: 115,
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '9',
        title: 'Java',
        imageUrl: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 22,
          '❤️': 18,
          '😂': 6,
          '🔥': 15,
          '👎': 4,
          '😡': 3
        },
        votes: 68,
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '9',
        title: 'C++',
        imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 15,
          '❤️': 12,
          '😂': 4,
          '🔥': 8,
          '👎': 6,
          '😡': 4
        },
        votes: 49,
        rank: 4
      },
      {
        id: 'opt5',
        pollId: '9',
        title: 'Go',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 12,
          '❤️': 8,
          '😂': 3,
          '🔥': 6,
          '👎': 2,
          '😡': 1
        },
        votes: 32,
        rank: 5
      },
      {
        id: 'opt6',
        pollId: '9',
        title: 'Rust',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
        reactions: {
          '👍': 8,
          '❤️': 6,
          '😂': 2,
          '🔥': 4,
          '👎': 1,
          '😡': 1
        },
        votes: 21,
        rank: 6
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
