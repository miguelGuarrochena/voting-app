'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import usePollStore from '@/store/pollStore';
import PollDetail from '@/components/poll/PollDetail';

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
      <div className="px-3 sm:px-6 py-2 md:py-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
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
      <div className="px-3 sm:px-6 py-2 md:py-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto bg-red-50 border-l-4 border-red-400 p-4">
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

  return (
    <div className="px-3 sm:px-6 py-6 md:py-8 pb-20 md:pb-8 bg-[var(--bg)] min-h-screen">
      <PollDetail pollId={poll.id} />
    </div>
  );
}
