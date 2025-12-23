'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Poll } from '@/types/poll';
import PollCard from '@/components/PollCard';

export default function Home() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        // Mock data - in a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const now = new Date();
        const mockPolls: Poll[] = [
          {
            id: '1',
            question: 'What\'s your favorite programming language?',
            options: [
              { id: '1', text: 'TypeScript', votes: 42, emoji: '💙' },
              { id: '2', text: 'Python', votes: 35, emoji: '🐍' },
              { id: '3', text: 'JavaScript', votes: 28, emoji: '✨' },
            ],
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
            expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
            isExpired: false,
            totalVotes: 105,
            createdBy: 'devuser',
            userVotedOptionId: Math.random() > 0.5 ? '1' : undefined,
          },
          {
            id: '2',
            question: 'Best way to spend a weekend?',
            options: [
              { id: '1', text: 'Hiking', votes: 15, emoji: '⛰️' },
              { id: '2', text: 'Netflix & Chill', votes: 32, emoji: '🍿' },
              { id: '3', text: 'Coding', votes: 28, emoji: '💻' },
              { id: '4', text: 'Traveling', votes: 19, emoji: '✈️' },
            ],
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
            expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
            isExpired: false,
            totalVotes: 94,
            createdBy: 'traveler',
          },
          {
            id: '3',
            question: 'Preferred coffee drink?',
            options: [
              { id: '1', text: 'Espresso', votes: 25, emoji: '☕' },
              { id: '2', text: 'Latte', votes: 30, emoji: '🥛' },
              { id: '3', text: 'Cappuccino', votes: 20, emoji: '☕' },
              { id: '4', text: 'Americano', votes: 15, emoji: '☕' },
              { id: '5', text: 'I don\'t drink coffee', votes: 10, emoji: '🚫' },
            ],
            createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
            expiresAt: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago (expired)
            isExpired: true,
            totalVotes: 100,
            createdBy: 'coffeelover',
            userVotedOptionId: '2',
          },
        ];

        setPolls(mockPolls);
      } catch (err) {
        console.error('Failed to fetch polls:', err);
        setError('Failed to load polls. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Welcome to Pickly
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Create and participate in fun polls with your friends
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/create" 
            className="px-6 py-3 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
          >
            Create a Poll
          </Link>
          <Link 
            href="#featured" 
            className="px-6 py-3 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Browse Polls
          </Link>
        </div>
      </div>

      <div id="featured" className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Polls</h2>
          <div className="text-sm text-gray-500">
            Showing {polls.length} {polls.length === 1 ? 'poll' : 'polls'}
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j}>
                      <div className="h-4 bg-gray-100 rounded w-full mb-1"></div>
                      <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                    </div>
                  ))}
                </div>
                <div className="h-4 bg-gray-100 rounded w-1/2 mt-4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
        
        {!isLoading && polls.length === 0 && !error && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No polls yet</h3>
            <p className="mt-1 text-sm text-gray-500">Be the first to create a poll!</p>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                New Poll
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
