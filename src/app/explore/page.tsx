'use client';

import { PageLayout } from '@/components/PageLayout';
import { useLanguage } from '@/context/LanguageContext';

const ExplorePage = () => {
  const { t } = useLanguage();

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{t('common.emptyState')}</h3>
        </div>
      </div>
    </PageLayout>
  );
};

export default ExplorePage;
