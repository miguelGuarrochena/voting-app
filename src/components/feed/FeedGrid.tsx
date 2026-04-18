'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import usePollStore from '@/store/pollStore';
import { PollCard } from '@/components/poll/PollCard';

const FeedGrid = () => {
  // Select individual values from the store to prevent unnecessary re-renders
  const polls = usePollStore((state) => state.polls);
  const filter = usePollStore((state) => state.filter);
  const loadPolls = usePollStore((state) => state.loadPolls);
  const setFilter = usePollStore((state) => state.setFilter);
  const canUserAccessPoll = usePollStore((state) => state.canUserAccessPoll);

  // Current user ID (in a real app, this would come from auth context)
  const currentUserId = 'current-user';
  
  // Memoize filter handlers to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilter: 'trending' | 'recent' | 'expiring') => {
    setFilter(newFilter);
  }, [setFilter]);
  
  // Load polls on mount and when filter changes
  useEffect(() => {
    loadPolls();
  }, [loadPolls]);
  
  // Memoize sorted polls to prevent unnecessary re-renders
  const sortedPolls = useMemo(() => {
    // Filter polls by access - only show polls the user can access
    const accessiblePolls = polls.filter(p => canUserAccessPoll(p.id, currentUserId));

    return [...accessiblePolls].sort((a, b) => {
      if (filter === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (filter === 'expiring') {
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      } else {
        // Default to trending (sort by total reactions)
        return b.totalReactions - a.totalReactions;
      }
    });
  }, [polls, filter, canUserAccessPoll, currentUserId]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {filter === 'trending' ? 'Trending Polls' : 
           filter === 'recent' ? 'Recent Polls' : 'Ending Soon'}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('trending')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'trending'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => handleFilterChange('recent')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'recent'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => handleFilterChange('expiring')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              filter === 'expiring'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ending Soon
          </button>
        </div>
      </div>
      
      {/* Polls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPolls.map((poll, index) => (
          <PollCard key={`${poll.id}-${index}`} poll={poll} />
        ))}
      </div>
      
      {sortedPolls.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No polls found</div>
          <p className="mt-2 text-gray-500">Be the first to create a poll!</p>
        </div>
      )}
    </div>
  );
};

export default FeedGrid;
