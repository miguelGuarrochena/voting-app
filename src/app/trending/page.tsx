'use client';

import { PageLayout } from '@/components/PageLayout';

const TrendingPage = () => {
  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔥</div>
          <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Compartí un link para que tus amigos puedan votar ✨</h3>
        </div>
      </div>
    </PageLayout>
  );
};

export default TrendingPage;
