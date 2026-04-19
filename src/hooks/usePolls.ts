import { useEffect, useState } from 'react';
import usePollStore from '@/store/pollStore';
import { Poll } from '@/types/poll';

type SortOption = 'recent' | 'popular' | 'trending' | 'expiring';

export const usePolls = () => {
  const { polls, loadPolls, isLoading } = usePollStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPolls();
  }, [loadPolls]);

  const getFilteredPolls = (
    searchQuery: string = '',
    sortBy: SortOption = 'recent',
    visibility?: 'public' | 'private'
  ) => {
    let filtered = polls.filter(poll => 
      visibility ? poll.visibility === visibility : true
    );

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(query) ||
        poll.options.some(option => 
          (option.title || '').toLowerCase().includes(query)
        )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => {
          const aVotes = a.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          const bVotes = b.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          return bVotes - aVotes;
        });
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const aVotes = a.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          const bVotes = b.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          const aRecent = new Date(a.createdAt).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000);
          const bRecent = new Date(b.createdAt).getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (aRecent && !bRecent) return -1;
          if (!aRecent && bRecent) return 1;
          return bVotes - aVotes;
        });
        break;
      case 'expiring':
        filtered.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
        break;
    }

    return filtered;
  };

  const getActivePolls = (limit?: number) => {
    const active = polls.filter(poll => 
      new Date(poll.expiresAt) > new Date() && poll.visibility === 'public'
    );
    return limit ? active.slice(0, limit) : active;
  };

  const getTrendingPolls = (limit?: number) => {
    const trending = getFilteredPolls('', 'trending', 'public');
    return limit ? trending.slice(0, limit) : trending;
  };

  const getPollById = (id: string): Poll | undefined => {
    return polls.find(poll => poll.id === id);
  };

  return {
    polls,
    isLoading,
    mounted,
    getFilteredPolls,
    getActivePolls,
    getTrendingPolls,
    getPollById,
  };
};
