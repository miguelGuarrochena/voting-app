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
import { Plus, Menu as MenuIcon, X, Moon, Sun, Globe } from 'lucide-react';
import { IconLayoutList, IconUser, IconLock, IconLogout } from '@tabler/icons-react';
import { getCreatorAvatar } from '@/data/mockPolls';
import ThemeLanguageSwitcher from '@/components/ThemeLanguageSwitcher';
import { useTheme } from '@/context/ThemeContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
              {pathname !== '/' ? (
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
              <Link href="/" className="inline-flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold text-[var(--primary)] font-display">✨ Pickly</span>
              </Link>
            </div>

            {/* Right side - Burger menu */}
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {showMobileMenu && (
          <div className="fixed top-14 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] shadow-lg">
            <div className="py-2">
              {/* Theme toggle */}
              <button
                onClick={() => toggleTheme()}
                className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span>{theme === 'light' ? t('theme.dark') : t('theme.light')}</span>
              </button>

              {/* Language toggle */}
              <button
                onClick={() => toggleLanguage()}
                className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span>{language === 'en' ? t('lang.es') : t('lang.en')}</span>
              </button>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/settings"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <CogIcon className="w-5 h-5" />
                    <span>{t('nav.settings')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>{t('nav.login')}</span>
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <UserCircleIcon className="w-5 h-5" />
                    <span>{t('nav.signup')}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Click outside to close mobile menu */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)] border-t border-[var(--border)]">
          <div className="flex items-center justify-between px-2 py-1 sm:py-2 pb-[env(safe-area-inset-bottom)]">
            <Link
              href="/votes"
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/votes' ? 'text-[var(--text)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" />
              <span className="text-xs mt-1">Votes</span>
            </Link>

            <Link
              href="/ranking"
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/ranking' ? 'text-[var(--text)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" />
              <span className="text-xs mt-1">Ranking</span>
            </Link>

            <Link
              href="/ratings"
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/ratings' ? 'text-[var(--text)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" />
              <span className="text-xs mt-1">Ratings</span>
            </Link>

            <Link
              href="/spin"
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/spin' ? 'text-[var(--text)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <ArrowPathIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300" />
              <span className="text-xs mt-1">Spin</span>
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
              className={`text-base lg:text-lg font-medium transition-all duration-300 ease-out flex items-center space-x-2 px-3 py-2 rounded-lg ${
                pathname === '/votes'
                  ? 'text-[var(--text)] bg-[var(--surface-2)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 transition-transform duration-300" />
              <span>Votes</span>
            </Link>

            <Link
              href="/ranking"
              className={`text-base lg:text-lg font-medium transition-all duration-300 ease-out flex items-center space-x-2 px-3 py-2 rounded-lg ${
                pathname === '/ranking'
                  ? 'text-[var(--text)] bg-[var(--surface-2)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50'
              }`}
            >
              <TrophyIcon className="w-5 h-5 transition-transform duration-300" />
              <span>Ranking</span>
            </Link>

            <Link
              href="/ratings"
              className={`text-base lg:text-lg font-medium transition-all duration-300 ease-out flex items-center space-x-2 px-3 py-2 rounded-lg ${
                pathname === '/ratings'
                  ? 'text-[var(--text)] bg-[var(--surface-2)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50'
              }`}
            >
              <StarIcon className="w-5 h-5 transition-transform duration-300" />
              <span>Ratings</span>
            </Link>

            <Link
              href="/spin"
              className={`text-base lg:text-lg font-medium transition-all duration-300 ease-out flex items-center space-x-2 px-3 py-2 rounded-lg ${
                pathname === '/spin'
                  ? 'text-[var(--text)] bg-[var(--surface-2)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/50'
              }`}
            >
              <ArrowPathIcon className="w-5 h-5 transition-transform duration-300" />
              <span>Spin</span>
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
