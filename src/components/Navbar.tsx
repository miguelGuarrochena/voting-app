'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  FireIcon, 
  UserCircleIcon,
  PlusIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { getCreatorAvatar } from '@/data/mockPolls';
import ThemeLanguageSwitcher from '@/components/ThemeLanguageSwitcher';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
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
        <div className="fixed top-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)]">
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
              <ThemeLanguageSwitcher />
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
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)]">
          <div className="flex items-center justify-around py-1 sm:py-2 pb-[env(safe-area-inset-bottom)]">
            <Link
              href="/"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                pathname === '/' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">{t('nav.home')}</span>
            </Link>

            <Link
              href="/explore"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                pathname === '/explore' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs mt-1">{t('nav.explore')}</span>
            </Link>

            <Link
              href="/spin"
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                pathname === '/spin' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <CogIcon className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              <span className="text-xs mt-1">{t('nav.spin')}</span>
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
              <span className="text-xs mt-1">{t('nav.trending')}</span>
              {pathname === '/trending' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                href="/settings"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  pathname === '/settings' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <CogIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs mt-1">{t('nav.settings')}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex flex-col items-center p-2 rounded-lg transition-colors text-[var(--text-muted)]"
              >
                <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs mt-1">{t('nav.login')}</span>
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
    <nav className={`fixed top-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)] transition-all ${
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
              href="/"
              className={`relative text-base lg:text-lg font-medium transition-colors ${
                pathname === '/' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {t('nav.explore')}
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
              <span>{t('nav.trending')}</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {pathname === '/trending' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>

            <Link
              href="/spin"
              className={`relative text-base lg:text-lg font-medium transition-colors flex items-center space-x-2 ${
                pathname === '/spin' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <CogIcon className="w-5 h-5 animate-spin" />
              <span>{t('nav.spin')}</span>
              {pathname === '/spin' && (
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
              {t('nav.create')}
              {pathname === '/create' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-100 transition-transform" />
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] transform scale-x-0 transition-transform hover:scale-x-100" />
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeLanguageSwitcher />
            {isAuthenticated ? (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-sm font-medium">
                  {getCreatorAvatar(user?.name || 'User')}
                </div>
                <Link
                  href="/create"
                  className="bg-[var(--primary)] text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base"
                >
                  {t('nav.createPoll')}
                </Link>
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
          </div>
        </div>
      </div>
    </nav>
  );
}
