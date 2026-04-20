'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, Trash2, Copy, Check } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { useUsername } from '@/context/UsernameContext';
import { generateToken, generateShareLink, storePollData } from '@/lib/token';
import { generateBracket, getVoteSuggestion } from '@/lib/bracket';
import { VersusTournament, VersusOption } from '@/types/versus';

type OptionForm = {
  id: string;
  title: string;
};

export default function CreateVersusPage() {
  const router = useRouter();
  const { username } = useUsername();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<OptionForm[]>([
    { id: crypto.randomUUID(), title: '' },
    { id: crypto.randomUUID(), title: '' },
  ]);
  const [votesToWin, setVotesToWin] = useState(4);
  const [selectedDuration, setSelectedDuration] = useState('3');
  const [groupSize, setGroupSize] = useState(6);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showShareScreen, setShowShareScreen] = useState(false);
  const [createdTournament, setCreatedTournament] = useState<{ token: string; shareLink: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Duration options (days)
  const durationOptions = [
    { value: '1', label: '1 day', days: 1 },
    { value: '3', label: '3 days', days: 3 },
    { value: '7', label: '7 days', days: 7 },
    { value: '14', label: '14 days', days: 14 },
  ];

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, { id: crypto.randomUUID(), title: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(option => option.id !== id));
  };

  const updateOption = (id: string, title: string) => {
    setOptions(options.map(option => (option.id === id ? { ...option, title } : option)));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    const validOptions = options.filter(option => option.title.trim() !== '');
    if (validOptions.length !== 4 && validOptions.length !== 8) {
      newErrors.options = 'You must have exactly 4 or 8 options';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Calculate expiration date
    const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
    const durationMs = (selectedOption?.days || 3) * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    // Generate token
    const token = generateToken();
    const shareLink = generateShareLink(token, 'versus');

    // Prepare options
    const validOptions = options
      .filter(option => option.title.trim() !== '')
      .map(option => ({
        id: crypto.randomUUID(),
        title: option.title.trim(),
      }));

    // Generate bracket
    const bracket = generateBracket(validOptions, votesToWin);

    // Create tournament data
    const tournamentData: VersusTournament = {
      token,
      title: title.trim(),
      createdBy: username || 'Anonymous',
      options: validOptions,
      votesToWin,
      expiresAt: expiresAt.toISOString(),
      bracket,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    storePollData(token, tournamentData, 'versus');

    // Show share screen
    setCreatedTournament({ token, shareLink });
    setShowShareScreen(true);
  };

  const handleCopy = async () => {
    if (!createdTournament) return;
    try {
      await navigator.clipboard.writeText(createdTournament.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const suggestedVotes = getVoteSuggestion(groupSize);

  if (showShareScreen && createdTournament) {
    return (
      <PageLayout className="pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
              ¡Torneo creado {username}! Comparte el link ⚔️
            </h2>
            <p className="text-[var(--text-muted)] mb-6">
              Share the link below to start the tournament
            </p>

            {/* Share Link */}
            <div className="bg-[var(--surface-2)] rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={createdTournament.shareLink}
                  readOnly
                  className="flex-1 bg-transparent border-none text-[var(--text)] text-sm focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm flex items-center gap-2"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setShowShareScreen(false);
                router.push('/versus');
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium"
            >
              ← Back to Versus
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <Link
            href="/versus"
            className="hidden sm:block text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-6">Create Versus Tournament ⚔️</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Tournament Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="e.g., Best 90s song"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              Options * (exactly 4 or 8)
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option.title}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={`Option ${index + 1}`}
                      maxLength={50}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    disabled={options.length <= 2}
                    className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={options.length <= 2 ? "You need at least 2 options" : "Remove option"}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= 8}
              className="mt-3 px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-4 h-4" />
              Add Option
            </button>
            {errors.options && <p className="mt-1 text-sm text-red-600">{errors.options}</p>}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Current: {options.filter(o => o.title.trim()).length} options (need exactly 4 or 8)
            </p>
          </div>

          {/* Votes to Win */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Votes to Win a Duel *
            </label>
            <div className="flex items-center gap-4 mb-3">
              <input
                type="range"
                min="1"
                max="10"
                value={votesToWin}
                onChange={(e) => setVotesToWin(Number(e.target.value))}
                className="flex-1 accent-[var(--primary)]"
              />
              <span className="text-2xl font-bold text-[var(--primary)] w-12 text-center">{votesToWin}</span>
            </div>
            <div className="bg-[var(--surface-2)] rounded-lg p-3">
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Group size (for suggestion)
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm"
              />
              <p className="mt-2 text-sm text-[var(--primary)]">
                💡 For a group of ~{groupSize} people we suggest {suggestedVotes} votes
              </p>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Time Limit *
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
              Tournament expires in {durationOptions.find(d => d.value === selectedDuration)?.label} if not completed
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Create Tournament
          </button>
        </form>
      </div>
    </PageLayout>
  );
}
