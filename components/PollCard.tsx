'use client';

import { Poll } from '../src/types/poll';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { usePollStore } from '../src/store/usePollStore';

interface PollCardProps {
  poll: Poll;
}

export default function PollCard({ poll }: PollCardProps) {
  const timeRemaining = formatDistanceToNow(poll.expiresAt, { addSuffix: true });
  const voteOnOption = usePollStore((state) => state.voteOnOption);
  
  const handleVote = (optionId: string) => {
    // Using a thumbs up emoji as the default reaction
    voteOnOption(poll.id, optionId, '👍');
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${poll.isExpired ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-gray-900">{poll.question}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          poll.isExpired 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {poll.isExpired ? 'Ended' : `Ends ${timeRemaining}`}
        </span>
      </div>
      
      <div className="mt-4 space-y-3">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 
            ? Math.round((option.votes / poll.totalVotes) * 100) 
            : 0;
            
          return (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {option.emoji} {option.text}
                </span>
                <span className="text-gray-500">
                  {percentage}% • {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                </span>
              </div>
              {option.image && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <img 
                    src={option.image} 
                    alt={option.text} 
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-sky-500 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {!poll.isExpired && (
                <button
                  onClick={() => handleVote(option.id)}
                  className="mt-1 text-xs text-sky-600 hover:text-sky-800 font-medium"
                >
                  Vote for this option
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} • Created by {poll.author.name}
        </p>
        <Link 
          href={`/polls/${poll.id}`}
          className="text-sm font-medium text-sky-600 hover:text-sky-800"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}
