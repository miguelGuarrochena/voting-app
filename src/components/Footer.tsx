'use client';

import { useLanguage } from '@/context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-8 text-center text-[var(--text-muted)]">
      <p>{t('footer.copyright')}</p>
    </footer>
  );
};

export default Footer;
