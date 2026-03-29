'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FeedGrid from '@/components/feed/FeedGrid';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              React, Vote, and Decide
            </motion.h1>
            <motion.p 
              className="mt-6 max-w-2xl mx-auto text-xl text-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Create beautiful polls with emoji reactions and see real-time results. 
              No sign-up required!
            </motion.p>
            
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link 
                href="/create" 
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Create a Poll
              </Link>
              <button 
                onClick={() => {
                  const featuredSection = document.getElementById('featured');
                  featuredSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-300"
              >
                Browse Polls
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Featured Polls Section */}
      <div id="featured" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Featured Polls
          </h2>
          <FeedGrid />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: '1. Create',
                  description: 'Create a poll with multiple options and custom images',
                  icon: '📝'
                },
                {
                  title: '2. Share',
                  description: 'Share your poll with friends or on social media',
                  icon: '🔗'
                },
                {
                  title: '3. React',
                  description: 'Vote with fun emoji reactions and see results in real-time',
                  icon: '🎉'
                }
              ].map((step, index) => (
                <motion.div 
                  key={step.title}
                  className="p-6 bg-gray-50 rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                >
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to create your first poll?</h2>
          <p className="text-xl text-blue-100 mb-8">It's free, fun, and takes less than a minute.</p>
          <Link 
            href="/create" 
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
}
