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
            <Link href="/privacy" className="hover:text-[var(--text)] transition-colors whitespace-nowrap">
              {t('footer.privacy')}
            </Link>
            <span aria-hidden="true" className="opacity-30">·</span>
            <Link href="/terms" className="hover:text-[var(--text)] transition-colors whitespace-nowrap">
              {t('footer.terms')}
            </Link>
            <span aria-hidden="true" className="opacity-30">·</span>
            <a
              href="mailto:hola@letspicky.com"
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
