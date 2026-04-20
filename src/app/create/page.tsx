'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CreatePollForm from '@/components/create/create-poll-form';
import { PageLayout } from '@/components/PageLayout';
import { useLanguage } from '@/context/LanguageContext';

function CreatePollContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const type = searchParams.get('type') as 'vote' | 'rank' | null;

  // Determine back link based on type
  const backLink = type === 'rank' ? '/ranking' : '/votes';

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link
            href={backLink}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← {t('create.back')}
          </Link>
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
