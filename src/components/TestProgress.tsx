'use client';

import { Poll } from '@/types/poll';

interface TestProgressBarProps {
  percentage: number;
}

export function TestProgressBar({ percentage }: TestProgressBarProps) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div 
        className="bg-blue-500 h-4 rounded-full"
        style={{ 
          width: `${safePercentage}%`,
          maxWidth: '100%'
        }}
      />
    </div>
  );
}

interface TestCardProps {
  poll: Poll;
}

export function TestCard({ poll }: TestCardProps) {
  const totalVotes = poll.options.reduce((sum, option) => sum + Object.values(option.reactions).reduce((a, b) => a + b, 0), 0);
  
  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 overflow-hidden">
      <h3 className="font-bold mb-4">{poll.title}</h3>
      <div className="space-y-3">
        {poll.options.map((option) => {
          const optionVotes = Object.values(option.reactions).reduce((a, b) => a + b, 0);
          const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          
          return (
            <div key={option.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <div className="flex justify-between mb-2">
                <span>{option.title}</span>
                <span>{percentage}%</span>
              </div>
              <TestProgressBar percentage={percentage} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
