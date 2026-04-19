'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CreatePollForm } from '@/components/create/create-poll-form';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageLayout } from '@/components/PageLayout';

function CreatePollContent() {
  const searchParams = useSearchParams();
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
            ← Back
          </Link>
        </div>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
            {type === 'vote' ? 'Create a New Vote' : type === 'rank' ? 'Create a New Ranking' : 'Create a New Poll'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm sm:text-base">Share your thoughts and gather opinions from your community</p>
        </div>
        <CreatePollForm defaultType={type || undefined} />
      </div>
    </PageLayout>
  );
}

const CreatePollPage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLayout className="flex items-center justify-center"><div>Loading...</div></PageLayout>}>
        <CreatePollContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default CreatePollPage;
