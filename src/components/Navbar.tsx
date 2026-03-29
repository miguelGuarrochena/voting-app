'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  FireIcon, 
  UserCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { getCreatorAvatar } from '@/data/mockPolls';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle scroll effect for desktop navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  // Mobile bottom tab bar
  if (isMobile) {
    return (
      <>
        {/* Top minimal bar */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-bold text-[var(--primary)] font-display">✨ Pickly</span>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isAuthenticated && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-xs sm:text-sm font-medium">
                  {getCreatorAvatar(user?.name || 'User')}
                </div>
              )}
              <Link
                href="/create"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shadow-lg"
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[var(--border)]">
          <div className="flex items-center justify-around py-1 sm:py-2 pb-[env(safe-area-inset-bottom)]">
            <Link
              href="/"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                pathname === '/' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              href="/explore"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                pathname === '/explore' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Explore</span>
            </Link>

            {/* Center CREATE button */}
            <Link
              href="/create"
              className="flex flex-col items-center p-2 sm:p-3 rounded-full bg-[var(--primary)] text-white shadow-lg -mt-2 sm:-mt-4 border-3 sm:border-4 border-white"
            >
              <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            <Link
              href="/trending"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
                pathname === '/trending' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <FireIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Trending</span>
              {pathname === '/trending' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                href="/profile"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  pathname === '/profile' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex flex-col items-center p-2 rounded-lg transition-colors text-[var(--text-muted)]"
              >
                <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs mt-1">Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Add padding to account for fixed elements */}
        <div className="h-14 sm:h-16"></div>
        <div className="h-16 sm:h-20"></div>
      </>
    );
  }

  // Desktop navbar
  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-b border-[var(--border)] transition-all ${
      scrolled ? 'shadow-sm' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-[var(--primary)] font-display">✨ Pickly</span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              href="/"
              className={`relative text-base lg:text-lg font-medium transition-colors ${
                pathname === '/' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Explore
              {pathname === '/' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>

            <Link
              href="/trending"
              className={`relative text-base lg:text-lg font-medium transition-colors flex items-center space-x-1 ${
                pathname === '/trending' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>Trending</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {pathname === '/trending' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>

            <Link
              href="/create"
              className={`relative text-base lg:text-lg font-medium transition-colors ${
                pathname === '/create' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Create
              {pathname === '/create' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-sm font-medium">
                  {getCreatorAvatar(user?.name || 'User')}
                </div>
                <Link
                  href="/create"
                  className="bg-[var(--primary)] text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base"
                >
                  Create Poll
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors text-sm sm:text-base"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-[var(--primary)] text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
