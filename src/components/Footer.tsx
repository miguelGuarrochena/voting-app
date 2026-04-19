'use client';

import { useLanguage } from '@/context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-8 text-center text-gray-500 dark:text-gray-400">
      <p>{t('footer.copyright')}</p>
    </footer>
  );
};

export default Footer;
