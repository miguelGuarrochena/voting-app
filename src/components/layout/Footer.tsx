'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="hidden md:block bg-[var(--bg)] border-t border-[var(--border)] py-4 text-[var(--text-muted)] text-xs">
      <div className="max-w-4xl mx-auto px-3 relative">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <img src="/icon-192.png" alt="Pickly" className="w-4 h-4" />
            <span className="font-medium text-[var(--text)]">Pickly</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-x-4 shrink-0">
            <a
              href="https://cafecito.app/miguelguarrochena"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--text)] transition-colors whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                <line x1="6" x2="6" y1="2" y2="4"/>
                <line x1="10" x2="10" y1="2" y2="4"/>
                <line x1="14" x2="14" y1="2" y2="4"/>
              </svg>
              cafecito
            </a>
            <span aria-hidden="true" className="opacity-30">·</span>
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors whitespace-nowrap">
              {t('footer.privacy')}
            </Link>
            <span aria-hidden="true" className="opacity-30">·</span>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors whitespace-nowrap">
              {t('footer.terms')}
            </Link>
            <span aria-hidden="true" className="opacity-30">·</span>
            <a
              href="https://miguelguarrochena.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text)] transition-colors whitespace-nowrap"
            >
              {t('footer.contact')}
            </a>
          </nav>
        </div>

        {/* Copyright - centered */}
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 whitespace-nowrap">
          © {new Date().getFullYear()} {t('footer.createdBy')}{' '}
          <a
            href="https://miguelguarrochena.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text)] transition-colors"
          >
            miguelguarrochena.dev
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
