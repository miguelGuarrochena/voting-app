'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrophyIcon,
  CogIcon,
  StarIcon,
  UserCircleIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Plus } from 'lucide-react';
import { IconLayoutList, IconUser, IconLock, IconLogout } from '@tabler/icons-react';
import { getCreatorAvatar } from '@/data/mockPolls';
import ThemeLanguageSwitcher from '@/components/ThemeLanguageSwitcher';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Handle scroll effect for desktop navbar
  useEffect(() => {
    const handleScroll = () => {
      if (!isMobile) {
        setScrolled(window.scrollY > 10);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

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
        <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side - Back button or spacer */}
            <div className="flex-1">
              {pathname !== '/votes' ? (
                <button
                  onClick={() => {
                    if (pathname === '/spin') {
                      // Dispatch custom event for spin page to handle step navigation
                      window.dispatchEvent(new CustomEvent('spin-back'));
                    } else {
                      router.back();
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-8" />
              )}
            </div>

            {/* Center - Logo always visible */}
            <div className="flex-1 text-center">
              <Link href="/votes" className="inline-flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold text-[var(--primary)] font-display">✨ Pickly</span>
              </Link>
            </div>

            {/* Right side - Theme/Language */}
            <div className="flex-1 flex justify-end">
              <ThemeLanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)] border-t border-[var(--border)]">
          <div className="flex items-center justify-between px-2 py-1 sm:py-2 pb-[env(safe-area-inset-bottom)]">
            <Link
              href="/votes"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 ${
                pathname === '/votes' ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Votes</span>
            </Link>

            <Link
              href="/ranking"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 ${
                pathname === '/ranking' ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Ranking</span>
            </Link>

            <Link
              href="/spin"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 ${
                pathname === '/explore' ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Spin</span>
            </Link>

            <Link
              href="/ratings"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 ${
                pathname === '/ratings' ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <StarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">Ratings</span>
            </Link>
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
    <nav className={`fixed top-0 left-0 right-0 z-40 bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] transition-all ${
      scrolled ? 'shadow-lg' : ''
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
              href="/votes"
              className={`relative text-base lg:text-lg font-medium transition-colors flex items-center space-x-2 ${
                pathname === '/votes' ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>Votes</span>
              {pathname === '/votes' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>

            <Link
              href="/ranking"
              className={`relative text-base lg:text-lg font-medium transition-colors flex items-center space-x-2 ${
                pathname === '/ranking' ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <TrophyIcon className="w-5 h-5" />
              <span>Ranking</span>
              {pathname === '/ranking' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>

            <Link
              href="/spin"
              className={`relative text-base lg:text-lg font-medium transition-colors flex items-center space-x-2 ${
                pathname === '/spin' ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Spin</span>
              {pathname === '/spin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>

            <Link
              href="/ratings"
              className={`relative text-base lg:text-lg font-medium transition-colors flex items-center space-x-2 ${
                pathname === '/ratings' ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <StarIcon className="w-5 h-5" />
              <span>Ratings</span>
              {pathname === '/ratings' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    {getCreatorAvatar(user?.name || 'User')}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
                      <div className="py-1">
                        <Link
                          href="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <CogIcon className="w-4 h-4" />
                          <span>{t('nav.settings')}</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserMenu(false);
                          }}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          <span>{t('nav.logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="bg-[var(--primary)] text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base flex items-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Create</span>
                  </button>

                  {showCreateMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 min-w-[180px] overflow-hidden">
                      <div className="py-1">
                        <Link
                          href="/create?type=vote"
                          onClick={() => setShowCreateMenu(false)}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <ChartBarIcon className="w-4 h-4" />
                          <span>Vote</span>
                        </Link>
                        <Link
                          href="/create?type=rank"
                          onClick={() => setShowCreateMenu(false)}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <TrophyIcon className="w-4 h-4" />
                          <span>Ranking</span>
                        </Link>
                        <Link
                          href="/spin"
                          onClick={() => setShowCreateMenu(false)}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          <span>Spin Wheel</span>
                        </Link>
                        <Link
                          href="/ratings/create"
                          onClick={() => setShowCreateMenu(false)}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <StarIcon className="w-4 h-4" />
                          <span>Ratings</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors text-sm sm:text-base"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-[var(--primary)] text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
            <ThemeLanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Click outside to close create menu */}
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCreateMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
