'use client';

import { useMemo } from 'react';
import { Poll } from '@/types/poll';

interface RankPollResultsProps {
  poll: Poll;
  allRankings: Record<string, string[]>; // userId -> rankedOptionIds
  totalParticipants: number;
}

export const RankPollResults = ({ poll, allRankings, totalParticipants }: RankPollResultsProps) => {
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

  // Calculate max possible score for progress bar
  const maxPossibleScore = useMemo(() => {
    const numOptions = poll.options.length;
    return totalParticipants * (numOptions - 1);
  }, [poll.options.length, totalParticipants]);

  // Check if there are any rankings
  const hasRankings = Object.keys(allRankings).length > 0;

  if (!hasRankings) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600 text-lg">No rankings submitted yet</p>
        <p className="text-gray-500 text-sm mt-2">Be the first to rank these options!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Borda Count Results:</strong> Options are ranked by total points. First place gets {poll.options.length - 1} points, second gets {poll.options.length - 2}, etc.
        </p>
      </div>

      {sortedOptions.map((option, index) => {
        const score = optionScores[option.id];
        const percentage = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;
        const isWinner = index === 0 && score > 0;

        return (
          <div
            key={option.id}
            className={`bg-white border-2 rounded-xl p-4 transition-all ${
              isWinner ? 'border-yellow-400 shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank badge */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  isWinner
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {index + 1}
              </div>

              {/* Option content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-semibold ${isWinner ? 'text-yellow-700' : 'text-gray-900'}`}>
                    {option.title}
                  </h3>
                  {isWinner && <span className="text-2xl">👑</span>}
                </div>

                {option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt={option.title}
                    className="w-20 h-20 object-cover rounded-lg mt-2"
                  />
                )}

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      <strong>{score}</strong> points
                    </span>
                    <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWinner ? 'bg-yellow-400' : 'bg-[var(--primary)]'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>Total participants: {totalParticipants}</p>
        <p>Total rankings: {Object.keys(allRankings).length}</p>
      </div>
    </div>
  );
};
