'use client';

import { useMemo } from 'react';
import { Poll } from '@/types/poll';

interface RankPollResultsProps {
  poll: Poll;
  allRankings: Record<string, string[]>; // userId -> rankedOptionIds
  totalParticipants: number;
  className?: string;
}

export const RankPollResults = ({ poll, allRankings, totalParticipants, className = '' }: RankPollResultsProps) => {
  // Calculate Borda count scores for each option
  const optionScores = useMemo(() => {
    const scores: Record<string, number> = {};
    const numOptions = poll.options.length;

    // Initialize scores to 0
    poll.options.forEach(option => {
      scores[option.id] = 0;
    });

    // Calculate Borda count: N-1 points for 1st, N-2 for 2nd, etc.
    Object.values(allRankings).forEach(ranking => {
      ranking.forEach((optionId, index) => {
        if (scores[optionId] !== undefined) {
          scores[optionId] += (numOptions - 1 - index);
        }
      });
    });

    return scores;
  }, [poll.options, allRankings]);

  // Sort options by score (highest first)
  const sortedOptions = useMemo(() => {
    return [...poll.options].sort((a, b) => {
      return optionScores[b.id] - optionScores[a.id];
    });
  }, [poll.options, optionScores]);

  // Check if there are any rankings
  const hasRankings = Object.keys(allRankings).length > 0;

  if (!hasRankings) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-lg">No rankings submitted yet</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Be the first to rank these options!</p>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <p className="text-blue-800 dark:text-blue-300 text-sm">
          Items are ranked by weighted score. The item most people ranked first earns the most points.
        </p>
      </div>

      {sortedOptions.map((option, index) => {
        const score = optionScores[option.id];
        const isWinner = index === 0 && score > 0;

        return (
          <div
            key={option.id}
            className={`bg-white dark:bg-gray-900 border-2 rounded-xl p-4 transition-all ${
              isWinner ? 'border-yellow-400 shadow-md' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Rank badge */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  isWinner
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {index + 1}
              </div>

              {/* Option content */}
              <div className="flex-1">
                <h3 className={`font-semibold ${isWinner ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'} mb-2`}>
                  {option.title}
                </h3>

                {option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt={option.title}
                    className="w-20 h-20 object-cover rounded-lg mt-2"
                  />
                )}

                {/* Point display */}
                <div className="mt-3">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    <strong>{score}</strong> {score === 1 ? 'point' : 'points'}
                  </span>
                </div>
              </div>

              {/* Crown in top-right corner for winner */}
              {isWinner && (
                <div className="text-[1.25rem] flex-shrink-0">
                  👑
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        <p>Total participants: {totalParticipants}</p>
        <p>Total rankings: {Object.keys(allRankings).length}</p>
      </div>
    </div>
  );
};
