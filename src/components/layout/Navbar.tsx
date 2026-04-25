'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useUsername } from '@/context/UsernameContext';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Plus, Menu as MenuIcon, X, Moon, Sun, Globe, Swords, LogOut } from 'lucide-react';
import ThemeLanguageSwitcher from '@/components/layout/ThemeLanguageSwitcher';
import { useTheme } from '@/context/ThemeContext';
import { safeBack } from '@/lib/navigation';
import { FEATURES } from '@/lib/features';

const Navbar = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { username, setUsername } = useUsername();
  const { user: authUser, email: authEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMedium, setIsMedium] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUsernameMenu, setShowUsernameMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showChangeUsernameModal, setShowChangeUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Handle scroll effect for desktop navbar
  useEffect(() => {
    const handleScroll = () => {
      if (!isMobile && !isMedium) {
        setScrolled(window.scrollY > 20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, isMedium]);

  const handleChangeUsername = () => {
    if (newUsername.trim().length >= 2 && newUsername.trim().length <= 20) {
      setUsername(newUsername.trim());
      setNewUsername('');
      setShowChangeUsernameModal(false);
      setShowUsernameMenu(false);
    }
  };

  // Logout unificado: si hay sesión de auth la cierra, y siempre limpia el
  // username local. Redirige a / con reload duro para limpiar todo.
  //
  // Orden importante: PRIMERO limpiamos local + redirigimos, DESPUÉS firamos
  // el signOut() en background. Antes hacíamos await signOut() ANTES del
  // redirect, lo que en redes lentas dejaba al user ~2s sin feedback visual
  // ("nada pasa" cuando clickea logout). Ahora la UI responde instantáneo.
  const handleLogout = () => {
    setShowMobileMenu(false);
    setShowUsernameMenu(false);
    setShowCreateMenu(false);

    // 1) Limpiar local INMEDIATO (antes del redirect, garantiza que el next
    //    page load no vea estado stale).
    try {
      localStorage.removeItem('pickly_username');
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('pickly_anon_modal_dismissed:')) toRemove.push(k);
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* ignore */
    }

    // 2) Fire-and-forget signOut. La request a supabase.auth.signOut() se
    //    sigue mandando, pero NO bloquea el redirect. El cookie/token
    //    server-side se revoca en background; el client lo limpia ya.
    if (authUser) {
      void signOut().catch(() => {
        /* la sesión local ya se va a limpiar con el reload */
      });
    }

    // 3) Redirect duro (reload). Reemplaza la URL actual en el history,
    //    así "back" no vuelve a la página privada en la que estaba.
    window.location.replace('/');
  };

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsMedium(width >= 768 && width < 1200);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Mobile bottom tab bar
  if (isMobile) {
    return (
      <>
        {/* Top minimal bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side - Back button or spacer */}
            <div className="flex-1">
              {pathname !== '/' && !['/votes', '/ranking', '/ratings', '/spin', '/versus'].includes(pathname) ? (
                <button
                  onClick={() => {
                    if (pathname === '/spin') {
                      // Dispatch custom event for spin page to handle step navigation
                      window.dispatchEvent(new CustomEvent('spin-back'));
                    } else {
                      safeBack(router, '/');
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
              {/* Username section */}
              {username && (
                <>
                  <div className="px-4 py-2 border-b border-[var(--border)] mb-2">
                    <p className="text-sm text-[var(--text-muted)]">{t('nav.hello')}, {username} ✨</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowChangeUsernameModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <span>{t('nav.changeName')}</span>
                  </button>
                </>
              )}

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
                <span>{language === 'en' ? t('theme.langEs') : t('theme.langEn')}</span>
              </button>

              <div className="border-t border-[var(--border)] my-2"></div>

              {/* Create options */}
              <Link
                href="/create?type=vote"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>{t('nav.createVote')}</span>
              </Link>
              <Link
                href="/create?type=rank"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <TrophyIcon className="w-5 h-5" />
                <span>{t('nav.createRanking')}</span>
              </Link>
              <Link
                href="/ratings/create"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <StarIcon className="w-5 h-5" />
                <span>{t('nav.createRating')}</span>
              </Link>
              <Link
                href="/spin"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span>{t('nav.spinWheel')}</span>
              </Link>
              {FEATURES.versus ? (
                <Link
                  href="/versus/create"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <Swords className="w-5 h-5" />
                  <span>{t('nav.createVersus')}</span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  title={t('versus.comingSoonTitle')}
                  className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                >
                  <Swords className="w-5 h-5" />
                  <span>{t('nav.createVersus')}</span>
                </div>
              )}

              {/* Logout unificado */}
              {(username || authUser) && (
                <>
                  <div className="border-t border-[var(--border)] my-2"></div>
                  {authUser && authEmail && (
                    <div className="px-4 py-2">
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {authEmail}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-start gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
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
          <div className="flex items-center justify-between px-2 py-3 pb-[env(safe-area-inset-bottom)]">
            <Link
              href="/votes"
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/votes' ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <ChartBarIcon className="w-6 h-6" />
            </Link>

            <Link
              href="/ranking"
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/ranking' ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <TrophyIcon className="w-6 h-6" />
            </Link>

            <Link
              href="/ratings"
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/ratings' ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <StarIcon className="w-6 h-6" />
            </Link>

            <Link
              href="/spin"
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                pathname === '/spin' ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
              }`}
            >
              <ArrowPathIcon className="w-6 h-6" />
            </Link>

            {FEATURES.versus ? (
              <Link
                href="/versus"
                className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-out flex-1 ${
                  pathname === '/versus' ? 'text-[var(--primary)] scale-110' : 'text-[var(--text-muted)] hover:scale-105 hover:text-[var(--text)]'
                }`}
              >
                <Swords className="w-6 h-6" />
              </Link>
            ) : (
              <div
                aria-disabled="true"
                title={t('versus.comingSoonTitle')}
                className="relative flex items-center justify-center p-2 rounded-lg flex-1 text-[var(--text-muted)] opacity-50 cursor-not-allowed"
              >
                <Swords className="w-6 h-6" />
              </div>
            )}
          </div>
        </div>

        {/* Add padding to account for fixed elements */}
        <div className="h-14"></div>
        <div className="h-16"></div>

        {/* Change Username Modal - outside nav to cover full screen */}
        {showChangeUsernameModal && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 p-4 bg-black/50">
            <div className="bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] p-6 w-full max-w-md mt-8">
              <h3 className="text-xl font-bold text-[var(--text)] mb-4">{t('nav.changeName')}</h3>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t('nav.yourNewName')}
                maxLength={20}
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChangeUsernameModal(false);
                    setNewUsername('');
                  }}
                  className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  {t('poll.cancel')}
                </button>
                <button
                  onClick={handleChangeUsername}
                  disabled={newUsername.trim().length < 2 || newUsername.trim().length > 20}
                  className="flex-1 px-4 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('nav.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop navbar
  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] transition-all duration-300 ${
        scrolled ? 'shadow-lg shadow-[var(--primary)]/10' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl sm:text-3xl font-bold text-[var(--primary)] font-display transition-transform group-hover:scale-105">✨ Pickly</span>
            </Link>

            {/* Center nav links */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/votes"
                className={`relative group flex items-center ${isMedium ? 'justify-center px-4' : 'space-x-2 px-4'} py-2.5 rounded-xl transition-all duration-300 ${
                  pathname === '/votes'
                    ? 'text-[var(--primary)] dark:text-white bg-[var(--primary)]/30 dark:bg-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <ChartBarIcon className={`w-5 h-5 transition-all duration-300 ${isMedium ? 'w-6 h-6' : ''} ${pathname === '/votes' ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isMedium && <span className="font-medium">{t('nav.votes')}</span>}
                {isMedium && (
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {t('nav.votes')}
                  </span>
                )}
              </Link>

              <Link
                href="/ranking"
                className={`relative group flex items-center ${isMedium ? 'justify-center px-4' : 'space-x-2 px-4'} py-2.5 rounded-xl transition-all duration-300 ${
                  pathname === '/ranking'
                    ? 'text-[var(--primary)] dark:text-white bg-[var(--primary)]/30 dark:bg-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <TrophyIcon className={`w-5 h-5 transition-all duration-300 ${isMedium ? 'w-6 h-6' : ''} ${pathname === '/ranking' ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isMedium && <span className="font-medium">{t('nav.ranking')}</span>}
                {isMedium && (
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {t('nav.ranking')}
                  </span>
                )}
              </Link>

              <Link
                href="/ratings"
                className={`relative group flex items-center ${isMedium ? 'justify-center px-4' : 'space-x-2 px-4'} py-2.5 rounded-xl transition-all duration-300 ${
                  pathname === '/ratings'
                    ? 'text-[var(--primary)] dark:text-white bg-[var(--primary)]/30 dark:bg-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <StarIcon className={`w-5 h-5 transition-all duration-300 ${isMedium ? 'w-6 h-6' : ''} ${pathname === '/ratings' ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isMedium && <span className="font-medium">{t('nav.ratings')}</span>}
                {isMedium && (
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {t('nav.ratings')}
                  </span>
                )}
              </Link>

              <Link
                href="/spin"
                className={`relative group flex items-center ${isMedium ? 'justify-center px-4' : 'space-x-2 px-4'} py-2.5 rounded-xl transition-all duration-300 ${
                  pathname === '/spin'
                    ? 'text-[var(--primary)] dark:text-white bg-[var(--primary)]/30 dark:bg-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <ArrowPathIcon className={`w-5 h-5 transition-all duration-300 ${isMedium ? 'w-6 h-6' : ''} ${pathname === '/spin' ? 'scale-110' : 'group-hover:rotate-180'}`} />
                {!isMedium && <span className="font-medium">{t('nav.spin')}</span>}
                {isMedium && (
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {t('nav.spin')}
                  </span>
                )}
              </Link>

              {FEATURES.versus ? (
                <Link
                  href="/versus"
                  className={`relative group flex items-center ${isMedium ? 'justify-center px-4' : 'space-x-2 px-4'} py-2.5 rounded-xl transition-all duration-300 ${
                    pathname === '/versus'
                      ? 'text-[var(--primary)] dark:text-white bg-[var(--primary)]/30 dark:bg-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Swords className={`w-5 h-5 transition-all duration-300 ${isMedium ? 'w-6 h-6' : ''} ${pathname === '/versus' ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {!isMedium && <span className="font-medium">{t('nav.versus')}</span>}
                  {isMedium && (
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {t('nav.versus')}
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  title={t('versus.comingSoonTitle')}
                  className={`relative group flex items-center ${isMedium ? 'justify-center px-4' : 'space-x-2 px-4'} py-2.5 rounded-xl text-[var(--text-muted)] opacity-60 cursor-not-allowed`}
                >
                  <Swords className={`w-5 h-5 ${isMedium ? 'w-6 h-6' : ''}`} />
                  {!isMedium && <span className="font-medium">{t('nav.versus')}</span>}
                  {isMedium && (
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                      {t('nav.versus')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {username && (
                <>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowUsernameMenu(false);
                        setShowCreateMenu((v) => !v);
                      }}
                      className={`relative group bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white ${isMedium ? 'px-4 py-2.5' : 'px-5 py-2.5'} rounded-full font-medium hover:shadow-lg hover:shadow-[var(--primary)]/30 hover:scale-105 transition-all duration-300 text-sm flex items-center ${isMedium ? 'justify-center' : 'gap-2'}`}
                    >
                      <Plus size={isMedium ? 20 : 16} className="transition-transform group-hover:rotate-90" />
                      {!isMedium && <span>{t('nav.create')}</span>}
                      {isMedium && (
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                          {t('nav.create')}
                        </span>
                      )}
                    </button>

                    {showCreateMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl shadow-[var(--primary)]/10 z-50 min-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="py-1">
                          <Link
                            href="/create?type=vote"
                            onClick={() => setShowCreateMenu(false)}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors group"
                          >
                            <ChartBarIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>{t('nav.vote')}</span>
                          </Link>
                          <Link
                            href="/create?type=rank"
                            onClick={() => setShowCreateMenu(false)}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors group"
                          >
                            <TrophyIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>{t('nav.ranking')}</span>
                          </Link>
                          <Link
                            href="/ratings/create"
                            onClick={() => setShowCreateMenu(false)}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors group"
                          >
                            <StarIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>{t('nav.ratings')}</span>
                          </Link>
                          <Link
                            href="/spin"
                            onClick={() => setShowCreateMenu(false)}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors group"
                          >
                            <ArrowPathIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            <span>{t('nav.spinWheel')}</span>
                          </Link>
                          {FEATURES.versus ? (
                            <Link
                              href="/versus/create"
                              onClick={() => setShowCreateMenu(false)}
                              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors group"
                            >
                              <Swords className="w-4 h-4 transition-transform group-hover:scale-110" />
                              <span>{t('nav.versus')}</span>
                            </Link>
                          ) : (
                            <div
                              aria-disabled="true"
                              title={t('versus.comingSoonTitle')}
                              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                            >
                              <Swords className="w-4 h-4" />
                              <span>{t('nav.versus')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowCreateMenu(false);
                        setShowUsernameMenu((v) => !v);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] rounded-full hover:bg-[var(--surface)] hover:shadow-md transition-all duration-300 border border-[var(--border)] hover:border-[var(--primary)]"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {username.charAt(0).toUpperCase()}
                      </div>
                    </button>
                    {showUsernameMenu && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl shadow-[var(--primary)]/10 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        {authUser && authEmail && (
                          <div className="px-4 py-2 border-b border-[var(--border)] mb-1">
                            <p className="text-xs text-[var(--text-muted)] truncate">
                              {authEmail}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setShowChangeUsernameModal(true);
                            setShowUsernameMenu(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors flex items-center gap-2"
                        >
                          <span>✏️</span>
                          <span>{t('nav.changeName')}</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('nav.logout')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              <ThemeLanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close create menu */}
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowCreateMenu(false)}
        />
      )}

      {/* Click outside to close username menu */}
      {showUsernameMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUsernameMenu(false)}
        />
      )}

      {/* Add padding to account for fixed navbar */}
      <div className="h-16"></div>

      {/* Change Username Modal - outside nav to cover full screen */}
      {showChangeUsernameModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 p-4 bg-black/50">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] p-6 w-full max-w-md mt-8">
            <h3 className="text-xl font-bold text-[var(--text)] mb-4">{t('nav.changeName')} ✨</h3>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={t('nav.yourNewName')}
              maxLength={20}
              className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangeUsernameModal(false);
                  setNewUsername('');
                }}
                className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                {t('poll.cancel')}
              </button>
              <button
                onClick={handleChangeUsername}
                disabled={newUsername.trim().length < 2 || newUsername.trim().length > 20}
                className="flex-1 px-4 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('nav.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
