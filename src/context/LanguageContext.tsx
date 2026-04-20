'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Import translation files
import commonEn from '@/locales/en/common.json';
import navEn from '@/locales/en/nav.json';
import settingsEn from '@/locales/en/settings.json';
import themeEn from '@/locales/en/theme.json';
import homeEn from '@/locales/en/home.json';
import spinEn from '@/locales/en/spin.json';
import pollEn from '@/locales/en/poll.json';
import createEn from '@/locales/en/create.json';
import myPollsEn from '@/locales/en/myPolls.json';
import emptyEn from '@/locales/en/empty.json';
import votesEn from '@/locales/en/votes.json';
import formEn from '@/locales/en/form.json';
import exploreEn from '@/locales/en/explore.json';
import versusEn from '@/locales/en/versus.json';
import footerEn from '@/locales/en/footer.json';
import rankingEn from '@/locales/en/ranking.json';
import ratingsEn from '@/locales/en/ratings.json';

import commonEs from '@/locales/es/common.json';
import navEs from '@/locales/es/nav.json';
import settingsEs from '@/locales/es/settings.json';
import themeEs from '@/locales/es/theme.json';
import homeEs from '@/locales/es/home.json';
import spinEs from '@/locales/es/spin.json';
import pollEs from '@/locales/es/poll.json';
import createEs from '@/locales/es/create.json';
import myPollsEs from '@/locales/es/myPolls.json';
import emptyEs from '@/locales/es/empty.json';
import votesEs from '@/locales/es/votes.json';
import formEs from '@/locales/es/form.json';
import exploreEs from '@/locales/es/explore.json';
import versusEs from '@/locales/es/versus.json';
import footerEs from '@/locales/es/footer.json';
import rankingEs from '@/locales/es/ranking.json';
import ratingsEs from '@/locales/es/ratings.json';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to flatten nested objects
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], newKey));
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

// Merge all translation files with section prefixes
const translations = {
  en: {
    ...flattenObject(commonEn, 'common'),
    ...flattenObject(navEn, 'nav'),
    ...flattenObject(settingsEn, 'settings'),
    ...flattenObject(themeEn, 'theme'),
    ...flattenObject(homeEn, 'home'),
    ...flattenObject(spinEn, 'spin'),
    ...flattenObject(pollEn, 'poll'),
    ...flattenObject(createEn, 'create'),
    ...flattenObject(myPollsEn, 'myPolls'),
    ...flattenObject(emptyEn, 'empty'),
    ...flattenObject(votesEn, 'votes'),
    ...flattenObject(formEn, 'form'),
    ...flattenObject(exploreEn, 'explore'),
    ...flattenObject(versusEn, 'versus'),
    ...flattenObject(footerEn, 'footer'),
    ...flattenObject(rankingEn, 'ranking'),
    ...flattenObject(ratingsEn, 'ratings')
  },
  es: {
    ...flattenObject(commonEs, 'common'),
    ...flattenObject(navEs, 'nav'),
    ...flattenObject(settingsEs, 'settings'),
    ...flattenObject(themeEs, 'theme'),
    ...flattenObject(homeEs, 'home'),
    ...flattenObject(spinEs, 'spin'),
    ...flattenObject(pollEs, 'poll'),
    ...flattenObject(createEs, 'create'),
    ...flattenObject(myPollsEs, 'myPolls'),
    ...flattenObject(emptyEs, 'empty'),
    ...flattenObject(votesEs, 'votes'),
    ...flattenObject(formEs, 'form'),
    ...flattenObject(exploreEs, 'explore'),
    ...flattenObject(versusEs, 'versus'),
    ...flattenObject(footerEs, 'footer'),
    ...flattenObject(rankingEs, 'ranking'),
    ...flattenObject(ratingsEs, 'ratings')
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Check for saved language preference or default to English
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      setLanguageState(savedLanguage);
    } else {
      // Check browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) {
        setLanguageState('es');
      } else {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    document.documentElement.setAttribute('lang', newLanguage);
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'es' : 'en';
    setLanguage(newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
