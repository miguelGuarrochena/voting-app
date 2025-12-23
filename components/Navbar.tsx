'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-sky-500 text-xl font-bold">
              Pickly
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/create" 
                  className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Create Poll
                </Link>
                <div className="relative ml-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-medium">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-700">{user?.name || 'User'}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="text-gray-700 hover:text-sky-500 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-sky-500 text-white hover:bg-sky-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-medium">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-sky-600 hover:text-sky-800"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/create"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Poll
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-sky-700 hover:bg-sky-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
