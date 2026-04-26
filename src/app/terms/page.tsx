'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';

export default function TermsPage() {
  const { t, language } = useLanguage();

  useEffect(() => {
    document.title = t('terms.title');
  }, [t, language]);

  return (
    <PageLayout className="pb-24 md:pb-16">
      <div className="max-w-3xl mx-auto px-1 sm:px-2 pt-6 sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('terms.home')}</span>
        </Link>

        <article className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-2">
            {t('terms.title')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            {t('terms.lastUpdated')}
          </p>

          <Section title={t('terms.section1Title')}>
            <p>
              {t('terms.section1Text')}
            </p>
          </Section>

          <Section title={t('terms.section2Title')}>
            <p>
              {t('terms.section2Text')}
            </p>
          </Section>

          <Section title={t('terms.section3Title')}>
            <p>
              {t('terms.section3Text')}
            </p>
          </Section>

          <Section title={t('terms.section4Title')}>
            <p>
              {t('terms.section4Text')}
            </p>
            <ul>
              <li>{t('terms.section4_1')}</li>
              <li>{t('terms.section4_2')}</li>
              <li>{t('terms.section4_3')}</li>
              <li>{t('terms.section4_4')}</li>
              <li>{t('terms.section4_5')}</li>
            </ul>
            <p>
              {t('terms.section4Text2')}
            </p>
          </Section>

          <Section title={t('terms.section5Title')}>
            <p>
              {t('terms.section5Text')}
            </p>
            <p>
              {t('terms.section5Text2')}
            </p>
          </Section>

          <Section title={t('terms.section6Title')}>
            <p>
              {t('terms.section6Text')}
            </p>
            <p>
              {t('terms.section6Text2')}
            </p>
          </Section>

          <Section title={t('terms.section7Title')}>
            <p>
              {t('terms.section7Text')}
            </p>
          </Section>

          <Section title={t('terms.section8Title')}>
            <p>
              {t('terms.section8Text')}
            </p>
          </Section>

          <Section title={t('terms.section9Title')}>
            <p>
              {t('terms.section9Text')}{' '}
              <Link href="/privacy" className="text-[var(--primary)] hover:underline">
                {t('terms.privacyLink')}
              </Link>
              .
            </p>
          </Section>

          <Section title={t('terms.section10Title')}>
            <p>
              {t('terms.section10Text')}
            </p>
          </Section>

          <Section title={t('terms.section11Title')}>
            <p>
              {t('terms.section11Text')}{' '}
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
