'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  SunIcon,
  MoonIcon,
  GlobeAltIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { announceNavbarMenuOpen, onNavbarMenuOpen } from '@/lib/navbarMenus';

const ThemeLanguageSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Close ourselves when another navbar menu opens (Crear / username menu).
  // The other menus live in Navbar.tsx — see lib/navbarMenus.ts.
  useEffect(() => {
    return onNavbarMenuOpen((menu) => {
      if (menu !== 'language') setShowLanguageMenu(false);
    });
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="relative p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-all duration-200 group"
        title={theme === 'light' ? t('theme.dark') : t('theme.light')}
      >
        <div className="relative">
          {theme === 'light' ? (
            <MoonIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
          ) : (
            <SunIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
          )}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary)] opacity-0 group-hover:opacity-20 transition-opacity" />
        </div>
      </button>

      {/* Language Toggle */}
      <div className="relative">
        <button
          onClick={() => {
            const next = !showLanguageMenu;
            setShowLanguageMenu(next);
            // Announce only on open — opening the language menu must close
            // the other navbar menus. Closing doesn't need to broadcast.
            if (next) announceNavbarMenuOpen('language');
          }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-all duration-200 group"
          title={language === 'en' ? t('theme.switchToSpanish') : t('theme.switchToEnglish')}
        >
          <div className="flex items-center gap-1.5">
            <GlobeAltIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
            <span className="text-sm font-semibold text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
              {language === 'en' ? 'EN' : 'ES'}
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-[var(--text-muted)] transition-all duration-200 ${
              showLanguageMenu ? 'rotate-180 text-[var(--primary)]' : 'group-hover:text-[var(--text)]'
            }`} />
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary)] opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>

        {showLanguageMenu && (
          <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => {
                  if (language !== 'en') {
                    toggleLanguage();
                  }
                  setShowLanguageMenu(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  language === 'en'
                    ? 'text-white bg-[var(--primary)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span>{t('theme.langEn')}</span>
                </div>
              </button>
              <button
                onClick={() => {
                  if (language !== 'es') {
                    toggleLanguage();
                  }
                  setShowLanguageMenu(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  language === 'es'
                    ? 'text-white bg-[var(--primary)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🇪🇸</span>
                  <span>{t('theme.langEs')}</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close language menu */}
      {showLanguageMenu && (
        <div
          className="fixed inset-0 z-60"
          onClick={() => setShowLanguageMenu(false)}
        />
      )}
    </div>
  );
};

export default ThemeLanguageSwitcher;
