'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CreatePollForm from '@/components/create/CreatePollForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { safeBack } from '@/lib/navigation';

function CreatePollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const type = searchParams.get('type') as 'vote' | 'rank' | null;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => safeBack(router, '/')}
            className="hidden md:flex text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← {t('create.back')}
          </button>
        </div>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
            {type === 'vote' ? t('create.newVote') : type === 'rank' ? t('create.newRanking') : t('create.newPoll')}
          </h1>
          <p className="text-[var(--text-muted)] text-sm sm:text-base">{t('create.description')}</p>
        </div>
        <CreatePollForm defaultType={type || undefined} />
      </div>
    </PageLayout>
  );
}

const CreatePollPage = () => {
  const { t } = useLanguage();

  return (
    <Suspense fallback={<PageLayout className="flex items-center justify-center"><div>{t('common.loading')}</div></PageLayout>}>
      <CreatePollContent />
    </Suspense>
  );
};

export default CreatePollPage;
