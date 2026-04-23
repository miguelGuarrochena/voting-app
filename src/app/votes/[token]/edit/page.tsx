'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getPoll, updatePoll, getPollResponses } from '@/lib/db';
import { findMyPoll } from '@/lib/mypolls';
import { PageLayout } from '@/components/layout/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import CreatePollForm from '@/components/create/CreatePollForm';

export default function EditVotePage() {
  const router = useRouter();
  const params = useParams();
  const { username } = useUsername();
  const { t } = useLanguage();

  const token = params.token as string;
  const [pollData, setPollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPoll = async () => {
      const data = await getPoll(token);
      if (!data) {
        setError('not_found');
        setLoading(false);
        return;
      }

      // Check if user is creator
      const my = findMyPoll(token);
      if (my?.role !== 'creator') {
        setError('not_creator');
        setLoading(false);
        return;
      }

      // Check if poll is expired
      const now = new Date();
      const expiryDate = new Date(data.expiresAt);
      if (expiryDate <= now) {
        setError('expired');
        setLoading(false);
        return;
      }

      // Block editing if responses already exist (avoid orphan option IDs)
      const responses = await getPollResponses(token);
      if (responses.length > 0) {
        setError('has_responses');
        setLoading(false);
        return;
      }

      setPollData(data);
      setLoading(false);
    };

    loadPoll();
  }, [token]);

  const handleUpdate = async (formData: any) => {
    const success = await updatePoll(token, formData);
    if (success) {
      toast.success(t('poll.updated'));
      router.push(`/votes/${token}`);
    } else {
      toast.error(t('poll.updateFailed'));
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      </PageLayout>
    );
  }

  if (error === 'not_found') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('votes.notFound')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('votes.notFoundDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error === 'not_creator') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('poll.notCreator')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('poll.notCreatorDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error === 'expired') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('poll.expired')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('poll.expiredEditDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error === 'has_responses') {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="text-6xl mb-4">🗳️</div>
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t('poll.hasResponses')}</h2>
            <p className="text-[var(--text-muted)] mb-6">{t('poll.hasResponsesDesc')}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-6">{t('poll.editVote')}</h1>
        <CreatePollForm
          defaultType="vote"
          initialData={pollData}
          onSubmit={handleUpdate}
          isEdit={true}
        />
      </div>
    </PageLayout>
  );
}
