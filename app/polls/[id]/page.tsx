'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import usePollStore from '../../../store/pollStore';
import PollDetail from '../../../components/PollDetail';

export default function PollPage() {
  const router = useRouter();
  const { id: pollId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Get the poll from the store
  const { getPollById } = usePollStore();
  const poll = getPollById(pollId as string);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!poll) {
        setError('Poll not found');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [poll]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          
          <div className="mt-8 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Poll not found. It may have been deleted or never existed.'}
              </p>
              <div className="mt-4">
                <Link 
                  href="/" 
                  className="text-sm font-medium text-red-700 hover:text-red-600 underline"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total votes for this poll
  const totalVotes = poll.options.reduce((sum, option) => {
    return sum + Object.values(option.reactions).reduce((a: number, b: number) => a + b, 0);
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to polls
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600 mb-4">{poll.description}</p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <span>Created by {poll.createdBy}</span>
            <span className="mx-2">•</span>
            <span>
              {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
            </span>
            <span className="mx-2">•</span>
            <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
            {new Date(poll.expiresAt) < new Date() ? (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Ended
              </span>
            ) : (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <PollDetail pollId={poll.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
