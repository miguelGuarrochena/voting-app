import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { pollApi, ApiResponse } from '@/services/api';
import { Poll } from '@/types/poll';
import usePollStore from '@/store/pollStore';

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
  const store = usePollStore();

  const handleVote = useCallback((optionId: string) => {
    store.voteOnOption(pollId, optionId);
  }, [pollId, store]);

  const handleReaction = useCallback((optionId: string, emoji: string) => {
    const currentReaction = store.userReactions[pollId]?.[optionId];

    if (currentReaction === emoji) {
      store.removeReaction(pollId, optionId);
    } else {
      store.reactToOption(pollId, optionId, emoji);
    }
  }, [pollId, store]);

  const hasVoted = !!store.userVotes[pollId];
  const votedOption = store.userVotes[pollId];

  return {
    handleVote,
    handleReaction,
    hasVoted,
    votedOption,
    userReactions: store.userReactions[pollId] || {},
    isInteracting: false
  };
}
