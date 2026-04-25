'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--border)] py-8 text-center text-[var(--text-muted)] text-sm">
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:underline hover:text-[var(--text)] transition-colors">
            {t('footer.privacy')}
          </Link>
          <span aria-hidden="true" className="opacity-40">·</span>
          <Link href="/terms" className="hover:underline hover:text-[var(--text)] transition-colors">
            {t('footer.terms')}
          </Link>
          <span aria-hidden="true" className="opacity-40">·</span>
          <a
            href="mailto:hola@letspicky.com"
            className="hover:underline hover:text-[var(--text)] transition-colors"
          >
            {t('footer.contact')}
          </a>
        </nav>
        <p>
          © {new Date().getFullYear()} {t('footer.createdBy')}{' '}
          <a
            href="https://miguelguarrochena.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            miguelguarrochena.dev
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
