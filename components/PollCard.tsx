'use client';

import { Poll } from '@/types/poll';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface PollCardProps {
  poll: Poll;
}

export default function PollCard({ poll }: PollCardProps) {
  const timeRemaining = formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true });
  
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-sky-500 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} • Created by {poll.createdBy}
        </p>
        <Link 
          href={`/polls/${poll.id}`}
          className="text-sm font-medium text-sky-600 hover:text-sky-500"
        >
          {poll.userVotedOptionId ? 'View results' : 'Vote now'}
        </Link>
      </div>
    </div>
  );
}
