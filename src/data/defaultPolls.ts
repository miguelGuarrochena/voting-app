import { Poll } from '@/types/poll';
import { v4 as uuidv4 } from 'uuid';

// Realistic and attractive mock polls in English
export const defaultPolls: Poll[] = [
  {
    id: '1',
    title: 'What\'s the best series to binge this weekend? 🍿',
    description: 'I\'m torn between several options. Help me choose!',
    titleImage: 'https://images.unsplash.com/photo-1489599809568-352b6a1a5a8c?w=800&q=80',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    visibility: 'public',
    createdBy: 'Sarah M.',
    totalReactions: 245,
    views: 523,
    options: [
      {
        id: 'opt1',
        pollId: '1',
        title: 'Breaking Bad',
        imageUrl: 'https://images.unsplash.com/photo-1595769082915-1c4bc9267b9c?w=400&q=80',
        votes: 89,
        reactions: {
          '👍': 45,
          '❤️': 28,
          '😂': 12,
          '🔥': 38,
          '👎': 3,
          '😡': 2
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '1',
        title: 'Stranger Things',
        imageUrl: 'https://images.unsplash.com/photo-1594908900068-1390e29e68e4?w=400&q=80',
        votes: 67,
        reactions: {
          '👍': 32,
          '❤️': 22,
          '😂': 8,
          '🔥': 25,
          '👎': 1,
          '😡': 1
        },
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '1',
        title: 'The Office',
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfdf3854?w=400&q=80',
        votes: 45,
        reactions: {
          '👍': 28,
          '❤️': 15,
          '😂': 35,
          '🔥': 18,
          '👎': 0,
          '😡': 0
        },
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '1',
        title: 'Friends',
        imageUrl: 'https://images.unsplash.com/photo-1511884642898-4fb9702f64c8?w=400&q=80',
        votes: 44,
        reactions: {
          '👍': 25,
          '❤️': 18,
          '😂': 28,
          '🔥': 15,
          '👎': 0,
          '😡': 0
        },
        rank: 4
      }
    ]
  },
  {
    id: '2',
    title: 'What food should we order for the office today? 🍕',
    description: 'We\'re 6 people and can\'t decide. Let the majority choose!',
    titleImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    visibility: 'public',
    createdBy: 'Mike R.',
    totalReactions: 189,
    views: 412,
    options: [
      {
        id: 'opt1',
        pollId: '2',
        title: 'Pizza 🍕',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
        votes: 78,
        reactions: {
          '👍': 42,
          '❤️': 25,
          '😂': 8,
          '🔥': 32,
          '👎': 2,
          '😡': 1
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '2',
        title: 'Tacos 🌮',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
        votes: 56,
        reactions: {
          '👍': 28,
          '❤️': 18,
          '😂': 12,
          '🔥': 22,
          '👎': 1,
          '😡': 1
        },
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '2',
        title: 'Sushi 🍣',
        imageUrl: 'https://images.unsplash.com/photo-1579584426539-a5c062d65c86?w=400&q=80',
        votes: 34,
        reactions: {
          '👍': 18,
          '❤️': 12,
          '😂': 6,
          '🔥': 15,
          '👎': 0,
          '😡': 0
        },
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '2',
        title: 'Burgers 🍔',
        imageUrl: 'https://images.unsplash.com/photo-1568901342478-3f35af52558b?w=400&q=80',
        votes: 21,
        reactions: {
          '👍': 12,
          '❤️': 8,
          '😂': 4,
          '🔥': 8,
          '👎': 0,
          '😡': 0
        },
        rank: 4
      }
    ]
  },
  {
    id: '3',
    title: 'Best destination for upcoming vacation? ✈️',
    description: 'Planning an unforgettable vacation. Where should I go?',
    titleImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25428?w=800&q=80',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    visibility: 'public',
    createdBy: 'Emma L.',
    totalReactions: 367,
    views: 892,
    options: [
      {
        id: 'opt1',
        pollId: '3',
        title: 'Playa del Carmen 🏖️',
        imageUrl: 'https://images.unsplash.com/photo-1519046290838-2a1b766432a0?w=400&q=80',
        votes: 145,
        reactions: {
          '👍': 78,
          '❤️': 52,
          '😂': 18,
          '🔥': 65,
          '👎': 3,
          '😡': 2
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '3',
        title: 'Paris 🗼',
        imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&q=80',
        votes: 89,
        reactions: {
          '👍': 45,
          '❤️': 38,
          '😂': 12,
          '🔥': 28,
          '👎': 2,
          '😡': 1
        },
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '3',
        title: 'Tokyo 🗾',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
        votes: 67,
        reactions: {
          '👍': 35,
          '❤️': 28,
          '😂': 8,
          '🔥': 22,
          '👎': 1,
          '😡': 1
        },
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '3',
        title: 'New York 🗽',
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8ec4750c877b?w=400&q=80',
        votes: 66,
        reactions: {
          '👍': 32,
          '❤️': 25,
          '😂': 10,
          '🔥': 20,
          '👎': 1,
          '😡': 0
        },
        rank: 4
      },
      {
        id: 'opt5',
        pollId: '3',
        title: 'Barcelona 🏰',
        imageUrl: 'https://images.unsplash.com/photo-1583894217816-65e281134209?w=400&q=80',
        votes: 45,
        reactions: {
          '👍': 22,
          '❤️': 18,
          '😂': 6,
          '🔥': 15,
          '👎': 0,
          '😡': 0
        },
        rank: 5
      }
    ]
  },
  {
    id: '4',
    title: 'Best programming language to learn in 2024? 💻',
    description: 'I want to start programming. What language do you recommend?',
    titleImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    visibility: 'public',
    createdBy: 'DevTeam',
    totalReactions: 423,
    views: 1256,
    options: [
      {
        id: 'opt1',
        pollId: '4',
        title: 'Python 🐍',
        imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&q=80',
        votes: 178,
        reactions: {
          '👍': 89,
          '❤️': 52,
          '😂': 12,
          '🔥': 68,
          '👎': 4,
          '😡': 2
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '4',
        title: 'JavaScript ⚡',
        imageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&q=80',
        votes: 134,
        reactions: {
          '👍': 68,
          '❤️': 42,
          '😂': 18,
          '🔥': 52,
          '👎': 3,
          '😡': 2
        },
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '4',
        title: 'Java ☕',
        imageUrl: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&q=80',
        votes: 56,
        reactions: {
          '👍': 28,
          '❤️': 22,
          '😂': 8,
          '🔥': 18,
          '👎': 4,
          '😡': 3
        },
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '4',
        title: 'Go 🐹',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
        votes: 34,
        reactions: {
          '👍': 18,
          '❤️': 12,
          '😂': 4,
          '🔥': 8,
          '👎': 2,
          '😡': 1
        },
        rank: 4
      },
      {
        id: 'opt5',
        pollId: '4',
        title: 'Rust 🦀',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
        votes: 21,
        reactions: {
          '👍': 12,
          '❤️': 8,
          '😂': 2,
          '🔥': 4,
          '👎': 1,
          '😡': 1
        },
        rank: 5
      }
    ]
  },
  {
    id: '5',
    title: 'What to do this Saturday night? 🎉',
    description: 'No plans yet. Help me decide!',
    titleImage: 'https://images.unsplash.com/photo-1516455590571-7963c177c72b?w=800&q=80',
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    visibility: 'public',
    createdBy: 'Lisa M.',
    totalReactions: 156,
    views: 387,
    options: [
      {
        id: 'opt1',
        pollId: '5',
        title: 'Movies 🎬',
        imageUrl: 'https://images.unsplash.com/photo-1489599809568-352b6a1a5a8c?w=400&q=80',
        votes: 67,
        reactions: {
          '👍': 35,
          '❤️': 22,
          '😂': 8,
          '🔥': 25,
          '👎': 2,
          '😡': 1
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '5',
        title: 'Hang out with friends 🍻',
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
        votes: 45,
        reactions: {
          '👍': 22,
          '❤️': 18,
          '😂': 12,
          '🔥': 18,
          '👎': 0,
          '😡': 0
        },
        rank: 2
      },
      {
        id: 'opt3',
        pollId: '5',
        title: 'Stay home 🏠',
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
        votes: 28,
        reactions: {
          '👍': 15,
          '❤️': 8,
          '😂': 6,
          '🔥': 10,
          '👎': 1,
          '😡': 0
        },
        rank: 3
      },
      {
        id: 'opt4',
        pollId: '5',
        title: 'Concert 🎵',
        imageUrl: 'https://images.unsplash.com/photo-1514525233901-ba36cef3b3c5?w=400&q=80',
        votes: 16,
        reactions: {
          '👍': 8,
          '❤️': 6,
          '😂': 3,
          '🔥': 5,
          '👎': 0,
          '😡': 0
        },
        rank: 4
      }
    ]
  },
  {
    id: '6',
    title: 'Coffee or tea to start the day? ☕',
    description: 'I always debate this. What do you prefer?',
    titleImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    visibility: 'public',
    createdBy: 'Peter S.',
    totalReactions: 298,
    views: 645,
    options: [
      {
        id: 'opt1',
        pollId: '6',
        title: 'Coffee ☕',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
        votes: 189,
        reactions: {
          '👍': 98,
          '❤️': 62,
          '😂': 18,
          '🔥': 78,
          '👎': 4,
          '😡': 2
        },
        rank: 1
      },
      {
        id: 'opt2',
        pollId: '6',
        title: 'Tea 🍵',
        imageUrl: 'https://images.unsplash.com/photo-1576092768248-5a0c0a445d81?w=400&q=80',
        votes: 109,
        reactions: {
          '👍': 52,
          '❤️': 38,
          '😂': 12,
          '🔥': 42,
          '👎': 2,
          '😡': 1
        },
        rank: 2
      }
    ]
  }
];

// Function to always initialize default polls
export const initializeDefaultPolls = (): Poll[] => {
  if (typeof window === 'undefined') return defaultPolls;
  
  try {
    const stored = localStorage.getItem('polls');
    const existingPolls = stored ? JSON.parse(stored) : [];
    
    // If no polls or less than 3, add default polls
    if (existingPolls.length < 3) {
      const combinedPolls = [...defaultPolls, ...existingPolls];
      localStorage.setItem('polls', JSON.stringify(combinedPolls));
      return combinedPolls;
    }
    
    return existingPolls;
  } catch (error) {
    console.warn('Error loading polls from localStorage:', error);
    return defaultPolls;
  }
};

// Function to reset to default polls
export const resetToDefaultPolls = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('polls', JSON.stringify(defaultPolls));
  } catch (error) {
    console.warn('Error resetting polls to default:', error);
  }
};
