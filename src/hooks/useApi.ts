import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { pollApi, ApiResponse } from '@/services/api';
import { Poll } from '@/types/poll';

// Generic hook for API calls with loading and error states
export function useApiCall<T, P extends any[] = []>(
  apiFunction: (...params: P) => Promise<ApiResponse<T>>,
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    retryCount?: number;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const stableOptions = useMemo(() => options, [options.onSuccess, options.onError, options.retryCount]);
  const stableApiFunction = useMemo(() => apiFunction, [apiFunction]);

  const execute = useCallback(async (...params: P) => {
    if (!hasMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await stableApiFunction(...params);
      setData(response.data);
      setRetryCount(0);
      stableOptions.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      stableOptions.onError?.(error);
      
      // Auto-retry for network errors up to 3 times
      if (error.message.includes('Network error') && retryCount < (stableOptions.retryCount || 2)) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => execute(...params), 1000 * (retryCount + 1)); // Exponential backoff
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [stableApiFunction, stableOptions, retryCount]);

  const hasMounted = useRef(false);
  
  useEffect(() => {
    hasMounted.current = true;
    if (stableOptions.immediate) {
      execute(...([] as unknown as P));
    }
    return () => {
      hasMounted.current = false;
    };
  }, [stableOptions.immediate]);

  return {
    data,
    loading,
    error,
    execute,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    }
  };
}

// Hook for getting all polls
export function usePolls() {
  const {
    data: polls = [],
    loading,
    error,
    execute: refreshPolls
  } = useApiCall<Poll[]>(pollApi.getPolls, { immediate: true });

  return {
    polls,
    loading,
    error,
    refreshPolls
  };
}

// Hook for getting a single poll
export function usePoll(pollId: string | null) {
  const {
    data: poll,
    loading,
    error,
    execute: loadPoll
  } = useApiCall<Poll | null, [string]>(
    (id: string) => pollApi.getPollById(id),
    { immediate: false }
  );

  useEffect(() => {
    if (pollId) {
      loadPoll(pollId);
    }
  }, [pollId, loadPoll]);

  return {
    poll,
    loading,
    error,
    loadPoll
  };
}

// Hook for creating a poll
export function useCreatePoll() {
  const {
    data: newPoll,
    loading,
    error,
    execute: createPoll,
    reset
  } = useApiCall<Poll, [Omit<Poll, 'id' | 'createdAt' | 'totalReactions' | 'views'>]>(
    pollApi.createPoll
  );

  return {
    createPoll,
    newPoll,
    loading,
    error,
    reset
  };
}

// Hook for voting
export function useVote() {
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const {
    data: updatedPoll,
    loading,
    error,
    execute: vote,
    reset
  } = useApiCall<Poll, [string, string]>(pollApi.voteOnOption);

  const voteOnOption = useCallback(async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    try {
      const result = await vote(pollId, optionId);
      return result;
    } finally {
      setVotingPollId(null);
    }
  }, [vote]);

  return {
    voteOnOption,
    updatedPoll,
    loading,
    error,
    isVoting: votingPollId !== null,
    reset
  };
}

// Hook for reactions
export function useReactions() {
  const [reactingPollId, setReactingPollId] = useState<string | null>(null);
  const {
    data: updatedPoll,
    loading,
    error,
    execute: react,
    reset
  } = useApiCall<Poll, [string, string, string]>(pollApi.reactToOption);

  const addReaction = useCallback(async (pollId: string, optionId: string, emoji: string) => {
    setReactingPollId(pollId);
    try {
      const result = await react(pollId, optionId, emoji);
      return result;
    } finally {
      setReactingPollId(null);
    }
  }, [react]);

  return {
    addReaction,
    updatedPoll,
    loading,
    error,
    isReacting: reactingPollId !== null,
    reset
  };
}

// Hook for removing reactions
export function useRemoveReaction() {
  const {
    data: updatedPoll,
    loading,
    error,
    execute: removeReaction,
    reset
  } = useApiCall<Poll, [string, string, string]>(pollApi.removeReaction);

  return {
    removeReaction,
    updatedPoll,
    loading,
    error,
    reset
  };
}

// Hook for managing user interactions (combining voting and reactions)
export function usePollInteractions(pollId: string) {
  const { voteOnOption, isVoting } = useVote();
  const { addReaction, isReacting } = useReactions();
  const { removeReaction } = useRemoveReaction();

  const [userVotes, setUserVotes] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('userVotes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [userReactions, setUserReactions] = useState<Record<string, Record<string, string>>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem('userReactions');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userVotes', JSON.stringify(userVotes));
    }
  }, [userVotes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userReactions', JSON.stringify(userReactions));
    }
  }, [userReactions]);

  const handleVote = useCallback(async (optionId: string) => {
    const previousVote = userVotes[pollId];
    
    try {
      await voteOnOption(pollId, optionId);
      setUserVotes(prev => ({
        ...prev,
        [pollId]: optionId
      }));
    } catch (error) {
      // Revert on error
      if (previousVote) {
        setUserVotes(prev => ({
          ...prev,
          [pollId]: previousVote
        }));
      }
      throw error;
    }
  }, [pollId, voteOnOption, userVotes]);

  const handleReaction = useCallback(async (optionId: string, emoji: string) => {
    const currentReaction = userReactions[pollId]?.[optionId];
    
    try {
      if (currentReaction === emoji) {
        // Remove reaction if clicking the same emoji
        await removeReaction(pollId, optionId, emoji);
        setUserReactions(prev => {
          const newReactions = { ...prev };
          if (newReactions[pollId]) {
            delete newReactions[pollId][optionId];
            if (Object.keys(newReactions[pollId]).length === 0) {
              delete newReactions[pollId];
            }
          }
          return newReactions;
        });
      } else {
        // Add or change reaction
        await addReaction(pollId, optionId, emoji);
        setUserReactions(prev => ({
          ...prev,
          [pollId]: {
            ...prev[pollId],
            [optionId]: emoji
          }
        }));
      }
    } catch (error) {
      // Revert on error
      if (currentReaction) {
        setUserReactions(prev => ({
          ...prev,
          [pollId]: {
            ...prev[pollId],
            [optionId]: currentReaction
          }
        }));
      }
      throw error;
    }
  }, [pollId, addReaction, removeReaction, userReactions]);

  const hasVoted = !!userVotes[pollId];
  const votedOption = userVotes[pollId];

  return {
    handleVote,
    handleReaction,
    hasVoted,
    votedOption,
    userReactions: userReactions[pollId] || {},
    isInteracting: isVoting || isReacting
  };
}
