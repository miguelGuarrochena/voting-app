'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import toast from 'react-hot-toast';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { generateShareLink } from '@/lib/token';
import { createTournament } from '@/lib/db';
import { generateBracket } from '@/lib/bracket';
import { VersusTournament, VersusOption } from '@/types/versus';

type OptionForm = {
  id: string;
  title: string;
};

type BracketSize = 4 | 8 | 16;

export default function CreateVersusPage() {
  const router = useRouter();
  const { username } = useUsername();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<OptionForm[]>([
    { id: crypto.randomUUID(), title: '' },
    { id: crypto.randomUUID(), title: '' },
  ]);
  const [selectedDuration, setSelectedDuration] = useState('3');
  const [bracketSize, setBracketSize] = useState<BracketSize>(8);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Duration options (days)
  const durationOptions = [
    { value: '1', label: t('versus.1day'), days: 1 },
    { value: '3', label: t('versus.3days'), days: 3 },
    { value: '7', label: t('versus.7days'), days: 7 },
    { value: '14', label: t('versus.14days'), days: 14 },
  ];

  // Bracket size options with preview icons
  const bracketSizeOptions: { value: BracketSize; label: string; icon: string }[] = [
    { value: 4, label: t('versus.4options'), icon: '🥊' },
    { value: 8, label: t('versus.8options'), icon: '⚔️' },
    { value: 16, label: t('versus.16options'), icon: '🏆' },
  ];

  const addOptionPair = () => {
    const maxOptions = bracketSize;
    if (options.length >= maxOptions) return;
    setOptions([
      ...options,
      { id: crypto.randomUUID(), title: '' },
      { id: crypto.randomUUID(), title: '' },
    ]);
  };

  const removeOptionPair = (index: number) => {
    if (options.length <= 4) return;
    const pairStartIndex = index * 2;
    setOptions(options.filter((_, i) => i !== pairStartIndex && i !== pairStartIndex + 1));
  };

  const updateOption = (id: string, title: string) => {
    setOptions(options.map(option => (option.id === id ? { ...option, title } : option)));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t('versus.titleRequired');
    } else if (title.trim().length < 3) {
      newErrors.title = t('versus.titleMinLength');
    }

    const validOptions = options.filter(option => option.title.trim() !== '');
    if (validOptions.length % 2 !== 0) {
      newErrors.options = t('versus.optionsMustBeEven');
    } else if (validOptions.length < 4) {
      newErrors.options = t('versus.min4OptionsRequired');
    } else if (validOptions.length > bracketSize) {
      newErrors.options = t('versus.maxOptionsForBracket').replace('{max}', String(bracketSize));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Calculate expiration date
    const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
    const durationMs = (selectedOption?.days || 3) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    // Prepare options - fill with TBD if needed to reach bracket size
    const validOptions = options
      .filter(option => option.title.trim() !== '')
      .map(option => ({
        id: crypto.randomUUID(),
        title: option.title.trim(),
      }));

    // Fill remaining slots with TBD if needed
    while (validOptions.length < bracketSize) {
      validOptions.push({
        id: crypto.randomUUID(),
        title: 'TBD',
      });
    }

    // Generate bracket
    const bracket = generateBracket(validOptions);

    // Create tournament via Supabase
    const token = await createTournament(
      title.trim(),
      username || 'Anónimo',
      expiresAt,
      validOptions,
      1, // votesToWin
      bracket
    );

    if (!token) {
      toast.error(t('versus.failedToCreate'));
      return;
    }

    // Redirect directly to detail page with success flag
    router.push(`/versus/${token}?created=true`);
  };

  // Check if form can be submitted
  const validOptions = options.filter(option => option.title.trim() !== '');
  const canSubmit = validOptions.length >= 4 && validOptions.length % 2 === 0 && validOptions.length <= bracketSize;

  // Auto-adjust bracket size based on option count
  useEffect(() => {
    if (validOptions.length > 8 && bracketSize < 16) {
      setBracketSize(16);
    } else if (validOptions.length > 4 && validOptions.length <= 8 && bracketSize < 8) {
      setBracketSize(8);
    }
  }, [validOptions.length, bracketSize]);

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="hidden md:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors inline-flex"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-6">{t('versus.createTournament')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.tournamentTitleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder={t('versus.tournamentTitlePlaceholder')}
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Bracket Size */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.bracketSizeLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {bracketSizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setBracketSize(option.value);
                    // Adjust options to match new bracket size
                    const currentValidOptions = options.filter(o => o.title.trim());
                    if (currentValidOptions.length > option.value) {
                      setOptions(options.slice(0, option.value));
                    }
                  }}
                  className={`px-3 py-3 rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center gap-1 ${
                    bracketSize === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              {t('versus.optionsLabel')}
            </label>
            <div className="space-y-4">
              {Array.from({ length: Math.ceil(options.length / 2) }).map((_, pairIndex) => {
                const optionA = options[pairIndex * 2];
                const optionB = options[pairIndex * 2 + 1];
                if (!optionA) return null;

                return (
                  <div key={pairIndex} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={optionA.title}
                        onChange={(e) => updateOption(optionA.id, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={t('versus.optionPlaceholder').replace('{n}', String(pairIndex * 2 + 1))}
                        maxLength={50}
                      />
                    </div>
                    <div className="text-[var(--text-muted)] font-bold px-2">{t('versus.vs')}</div>
                    {optionB ? (
                      <>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={optionB.title}
                            onChange={(e) => updateOption(optionB.id, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder={t('versus.optionPlaceholder').replace('{n}', String(pairIndex * 2 + 2))}
                            maxLength={50}
                          />
                        </div>
                        {options.length > 4 && (
                          <button
                            type="button"
                            onClick={() => removeOptionPair(pairIndex)}
                            className="p-2 text-red-500 hover:text-red-700"
                            title={t('versus.removePair')}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 opacity-30">
                        <div className="w-full px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400">
                          {t('versus.optionPlaceholder').replace('{n}', String(pairIndex * 2 + 2))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addOptionPair}
              disabled={options.length >= bracketSize}
              className="mt-3 px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />
              {t('versus.addPair')}
            </button>
            {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t('versus.currentOptions').replace('{count}', String(validOptions.length)).replace('{max}', String(bracketSize))}
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('versus.durationLabel')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedDuration(option.value)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedDuration === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t('versus.tournamentExpires').replace('{duration}', durationOptions.find(d => d.value === selectedDuration)?.label || '')}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('versus.createTournament')}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
