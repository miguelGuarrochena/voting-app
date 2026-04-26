'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';

export default function PrivacyPage() {
  const { t, language } = useLanguage();

  useEffect(() => {
    document.title = t('privacy.title');
  }, [t, language]);

  return (
    <PageLayout className="pb-24 md:pb-16">
      <div className="max-w-3xl mx-auto px-1 sm:px-2 pt-6 sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('privacy.home')}</span>
        </Link>

        <article className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-10 prose-invert">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2">
            {t('privacy.title')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            {t('privacy.lastUpdated')}
          </p>

          <Section title={t('privacy.summaryTitle')}>
            <p>
              {t('privacy.summaryText')}
            </p>
          </Section>

          <Section title={t('privacy.whatWeSaveTitle')}>
            <ul>
              <li>{t('privacy.whatWeSave1')}</li>
              <li>{t('privacy.whatWeSave2')}</li>
              <li>{t('privacy.whatWeSave3')}</li>
              <li>{t('privacy.whatWeSave4')}</li>
            </ul>
            <p>
              {t('privacy.whatWeSave5')}
              {' '}{t('privacy.whatWeSave6')}
            </p>
          </Section>

          <Section title={t('privacy.accountTitle')}>
            <p>
              {t('privacy.accountText')}
            </p>
            <ul>
              <li>{t('privacy.account1')}</li>
              <li>{t('privacy.account2')}</li>
              <li>{t('privacy.account3')}</li>
              <li>{t('privacy.account4')}</li>
            </ul>
            <p>
              {t('privacy.accountDelete')}{' '}
              <a href="mailto:hola@letspicky.com" className="text-[var(--primary)] hover:underline">
                hola@letspicky.com
              </a>
              . {t('privacy.accountDelete2')}
            </p>
          </Section>

          <Section title={t('privacy.cookiesTitle')}>
            <p>
              {t('privacy.cookiesText')}
            </p>
            <ul>
              <li>
                <strong>localStorage / sessionStorage</strong>: {t('privacy.cookies1')}
              </li>
              <li>
                <strong>Supabase Auth session cookies</strong>: {t('privacy.cookies2')}
              </li>
            </ul>
            <p>
              {t('privacy.cookies3')}
            </p>
          </Section>

          <Section title={t('privacy.analyticsTitle')}>
            <p>
              {t('privacy.analyticsText')}
            </p>
          </Section>

          <Section title={t('privacy.dataLocationTitle')}>
            <p>
              {t('privacy.dataLocationText')}
            </p>
          </Section>

          <Section title={t('privacy.deletePollTitle')}>
            <p>
              {t('privacy.deletePollText')}
            </p>
            <p>
              {t('privacy.deletePollText2')}{' '}
              <a href="mailto:hola@letspicky.com" className="text-[var(--primary)] hover:underline">
                hola@letspicky.com
              </a>{' '}
              {t('privacy.deletePollText3')}
            </p>
          </Section>

          <Section title={t('privacy.expiringPollsTitle')}>
            <p>
              {t('privacy.expiringPollsText')}
            </p>
          </Section>

          <Section title={t('privacy.minorsTitle')}>
            <p>
              {t('privacy.minorsText')}
            </p>
          </Section>

          <Section title={t('privacy.changesTitle')}>
            <p>
              {t('privacy.changesText')}
            </p>
          </Section>

          <Section title={t('privacy.contactTitle')}>
            <p>
              {t('privacy.contactText')}{' '}
              <a href="mailto:hola@letspicky.com" className="text-[var(--primary)] hover:underline">
                hola@letspicky.com
              </a>
              .
            </p>
          </Section>
        </article>
      </div>
    </PageLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h2 className="text-xl sm:text-2xl font-semibold text-[var(--text)] mb-3">
        {title}
      </h2>
      <div className="text-[var(--text-muted)] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-[var(--text)]">
        {children}
      </div>
    </section>
  );
}
