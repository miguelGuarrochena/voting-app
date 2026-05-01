'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEmptyReactions } from '@/types/poll';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import ImagePickerModal from './ImagePickerModal';
import { generateShareLink } from '@/lib/token';
import { createPoll } from '@/lib/db';
import { addMyPoll } from '@/lib/mypolls';
import { Trash2, Camera } from 'lucide-react';
import { PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { AnonCreateModal } from '@/components/auth/AnonCreateModal';


type FormPollOption = {
  id: string;
  text: string;
  image: string;
  emoji?: string;
};

interface CreatePollFormProps {
  defaultType?: 'vote' | 'rank';
  initialData?: any;
  isEdit?: boolean;
  onSubmit?: (formData: any) => void;
}

export default function CreatePollForm({ defaultType, initialData, isEdit, onSubmit }: CreatePollFormProps) {
  const router = useRouter();
  const { username } = useUsername();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [pollType, setPollType] = useState<'vote' | 'rank'>(defaultType || 'vote');
  const [title, setTitle] = useState(initialData?.title || '');
  const [titleImage, setTitleImage] = useState(initialData?.coverImage || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedDuration, setSelectedDuration] = useState('24h'); // Default to 24 hours
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [options, setOptions] = useState<FormPollOption[]>(
    initialData?.options?.map((opt: any) => ({
      id: opt.id,
      text: opt.title,
      image: opt.imageUrl || '',
      emoji: opt.emoji,
    })) || [
      { id: crypto.randomUUID(), text: '', image: '' },
      { id: crypto.randomUUID(), text: '', image: '' },
    ]
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerContext, setImagePickerContext] = useState<{
    type: 'title' | 'option';
    optionId?: string;
  } | null>(null);
  const [openEmojiPicker, setOpenEmojiPicker] = useState<string | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const titleFileInputRef = useRef<HTMLInputElement>(null);
  const [titleFileName, setTitleFileName] = useState<string>('');
  const optionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [optionFileNames, setOptionFileNames] = useState<Record<string, string>>({});

  // Duration options
  const durationOptions = [
    { value: '15min', label: t('form.duration.15min'), minutes: 15 },
    { value: '30min', label: t('form.duration.30min'), minutes: 30 },
    { value: '1h', label: t('form.duration.1h'), hours: 1 },
    { value: '3h', label: t('form.duration.3h'), hours: 3 },
    { value: '6h', label: t('form.duration.6h'), hours: 6 },
    { value: '12h', label: t('form.duration.12h'), hours: 12 },
    { value: '24h', label: t('form.duration.24h'), hours: 24 },
    { value: '48h', label: t('form.duration.48h'), hours: 48 },
    { value: '7d', label: t('form.duration.7d'), hours: 168 },
  ];

  // Emoji categories
  const emojiCategories = {
    smileys: ['😀', '😂', '😍', '🥰', '😎', '🤔', '😅', '😭', '😤', '🤩'],
    gestures: ['👍', '👎', '👏', '🙌', '🤝', '🫶', '👋', '✌️', '🤞', '💪'],
    objects: ['🔥', '⭐', '💡', '🎯', '🏆', '🎉', '🎊', '💎', '🚀', '⚡'],
    food: ['🍕', '🍔', '🍣', '🍜', '🌮', '🍦', '🍩', '🍺', '🥤', '🧁'],
    nature: ['🐶', '🐱', '🦁', '🐼', '🦊', '🌸', '🌊', '🌙', '⛅', '🌈']
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setOpenEmojiPicker(null);
      }
    };

    const handleBackdropClick = (event: MouseEvent) => {
      // Close when clicking on the backdrop (outside the picker content)
      if ((event.target as HTMLElement).classList.contains('fixed')) {
        setOpenEmojiPicker(null);
      }
    };

    if (openEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('mousedown', handleBackdropClick);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('mousedown', handleBackdropClick);
      };
    }
  }, [openEmojiPicker]);

  // Helper function to get context-specific labels
  const getContextLabel = (label: string) => {
    if (pollType === 'rank') {
      return label.replace('Poll', 'Ranking').replace('poll', 'ranking');
    }
    return label;
  };

  const addOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), text: '', image: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(option => option.id !== id));
  };

  const updateOption = (id: string, updates: Partial<FormPollOption>) => {
    setOptions(
      options.map(option =>
        option.id === id ? { ...option, ...updates } : option
      )
    );
  };

  const handleImageUpload = (optionId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [optionId]: t('form.onlyJpgPng')
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [optionId]: t('form.imageSize')
      }));
      return;
    }

    // Clear any previous errors for this option
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[optionId];
      return newErrors;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      updateOption(optionId, { image: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleTitleImageUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        titleImage: t('form.onlyJpgPng')
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        titleImage: t('form.imageSize')
      }));
      return;
    }

    // Clear any previous errors for title image
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.titleImage;
      return newErrors;
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      setTitleImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (optionId: string) => {
    updateOption(optionId, { image: '' });
    setOptionFileNames(prev => ({ ...prev, [optionId]: '' }));
  };

  const removeTitleImage = () => {
    setTitleImage('');
    setTitleFileName('');
  };

  const openImagePicker = (type: 'title' | 'option', optionId?: string) => {
    setImagePickerContext({ type, optionId });
    setImagePickerOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (imagePickerContext?.type === 'title') {
      setTitleImage(imageUrl);
    } else if (imagePickerContext?.type === 'option' && imagePickerContext.optionId) {
      updateOption(imagePickerContext.optionId, { image: imageUrl });
    }
    setImagePickerContext(null);
  };

  const isFormValid = () => {
    return title.trim().length >= 3 &&
           options.filter(opt => opt.text.trim() !== '').length >= 2 &&
           selectedDuration &&
           !loading;
  };

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!title.trim()) {
      newErrors.title = pollType === 'rank' ? t('create.titleRequired') : t('create.pollTitleRequired');
    } else if (title.trim().length < 3) {
      newErrors.title = t('create.titleMinLength');
    } else if (title.trim().length > 100) {
      newErrors.title = t('create.titleMaxLength');
    }

    // Options validation
    const validOptions = options.filter(option => option.text.trim() !== '');
    if (validOptions.length < 2) {
      newErrors.options = t('create.minOptions');
    } else if (validOptions.length > 10) {
      newErrors.options = t('create.maxOptions');
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.text.trim().toLowerCase());
    const duplicates = optionTexts.filter((text, index) => optionTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      newErrors.options = t('create.duplicateOptions');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      // Prepare options
      const pollOptions = options
        .filter(option => option.text.trim() !== '')
        .map(option => ({
          id: option.id,
          title: option.text.trim(),
          imageUrl: option.image || undefined,
          emoji: option.emoji,
        }));

      if (isEdit && onSubmit) {
        // Edit mode: call the onSubmit prop
        await onSubmit({
          title: title.trim(),
          description: description.trim(),
          coverImage: titleImage,
          options: pollOptions,
        });
      } else {
        // Create mode
        // Calculate expiration date from selected duration
        const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
        let durationMs: number;
        if (selectedOption?.minutes) {
          durationMs = selectedOption.minutes * 60 * 1000;
        } else {
          durationMs = (selectedOption?.hours || 24) * 60 * 60 * 1000;
        }
        const expiresAt = new Date(Date.now() + durationMs);

        // OJO: la ruta de vote es "/votes/[token]" en plural.
        // Antes mandábamos a "/vote/..." en singular → 404.
        const pollTypeForUrl = pollType === 'rank' ? 'ranking' : 'votes';
        const dbType = pollType === 'rank' ? 'ranking' : 'vote';

        // Add votes and reactions for new polls
        const pollOptionsWithStats = pollOptions.map(option => ({
          ...option,
          votes: 0,
          reactions: createEmptyReactions(),
        }));

        // Create poll via Supabase
        // description + coverImage son opcionales: solo se mandan si el
        // usuario los completó (ver supabase/content-v3.sql).
        const token = await createPoll(
          dbType as 'vote' | 'ranking' | 'rating',
          title.trim(),
          username || 'Anonymous',
          expiresAt,
          pollOptionsWithStats,
          {
            description: description.trim() || undefined,
            coverImage: titleImage || undefined,
          }
        );

        if (!token) {
          toast.error(pollType === 'rank' ? t('create.failedRanking') : t('create.failed'));
          setLoading(false);
          return;
        }

        // Guardar en "mis polls" (localStorage) como creador.
        addMyPoll({
          token,
          type: dbType === 'ranking' ? 'ranking' : 'vote',
          title: title.trim(),
          role: 'creator',
          createdBy: username || 'Anonymous',
          expiresAt: expiresAt.toISOString(),
        });

        // Redirect directly to detail page with success flag
        router.push(`/${pollTypeForUrl}/${token}?created=true`);
      }
    } catch (error) {
      console.error('[CreatePoll] Failed to create/update poll:', error);
      const errorMessage = pollType === 'rank' ? t('create.failedRanking') : t('create.failed');
      setSubmitError(errorMessage);
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-24 md:pb-8">
      {!isEdit && <AnonCreateModal />}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Poll Basics Section */}
        <div className="bg-[var(--surface)] rounded-xl shadow-md border border-[var(--border)] p-4 sm:p-6 md:p-8 min-w-0">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-6">{t('form.pollBasics')}</h2>

          <div className="space-y-6">
            {/* Poll Type Selector - Only show if not editing and defaultType is not provided */}
            {!isEdit && !defaultType && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-3">
                  {t('form.pollType')} *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPollType('vote')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      pollType === 'vote'
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🗳️</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{t('form.votePoll')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('form.votePollDesc')}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPollType('rank')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      pollType === 'rank'
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏆</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{t('form.rankPoll')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('form.rankPollDesc')}</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="title">
                {t('form.pollTitle')} *
              </label>
              <div className="space-y-3">
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.title ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                  placeholder={pollType === 'rank' ? t('form.whatsRankingAbout') : t('form.whatsPollAbout')}
                  maxLength={100}
                />

                {/* Title Image Upload */}
                <div className="mt-2 space-y-2">
                  <input
                    ref={titleFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setTitleFileName(file.name);
                        handleTitleImageUpload(file);
                      }
                    }}
                  />
                  <div className="flex flex-col lg:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => titleFileInputRef.current?.click()}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                      {t('ratings.upload')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openImagePicker('title')}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      {t('ratings.gallery')}
                    </button>
                    <label className="md:hidden cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTitleFileName(file.name);
                            handleTitleImageUpload(file);
                          }
                        }}
                      />
                      <span className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4" />
                        {t('ratings.camera')}
                      </span>
                    </label>
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">
                    {titleFileName || t('form.noFileChosen')}
                  </span>
                </div>
                {titleImage && (
                  <div className="relative">
                    <img
                      src={titleImage}
                      alt={t('form.titleImagePreview')}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeTitleImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                {errors.titleImage && (
                    <p className="text-xs text-red-600">{errors.titleImage}</p>
                  )}
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">{title.length}/100 {t('form.characters')}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="description">
                {t('form.description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 min-h-[100px]"
                placeholder={pollType === 'rank' ? t('form.addDetailsRanking') : t('form.addDetailsPoll')}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('create.charactersCounter').replace('{count}', String(description.length))}</p>
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="duration">
                  {t('form.expiration')} *
                </label>
                <select
                  id="duration"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors"
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{getContextLabel(t('create.autoCloseDuration'))}</p>
              </div>
            )}
          </div>
          {errors.options && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.options}</p>
            </div>
          )}
        </div>

        {/* Poll Options Section */}
        <div className="bg-[var(--surface)] rounded-xl shadow-md border border-[var(--border)] p-4 sm:p-6 md:p-8 min-w-0">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-4">{t('create.pollOptions')}</h2>
          <p className="font-body text-sm text-[var(--text-muted)] mb-6">
            {pollType === 'rank' ? t('create.addRankingOptionsDesc') : t('create.addOptionsDesc')}
          </p>

          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-2 sm:gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-2 min-w-0">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, { text: e.target.value })}
                      className="flex-1 min-w-0 px-3 sm:px-4 h-12 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('create.optionPlaceholder').replace('{n}', String(index + 1))}
                      maxLength={50}
                    />
                    <div className="relative" ref={openEmojiPicker === option.id ? emojiPickerRef : null}>
                      <div className="flex flex-col items-center">
                        <span className="hidden text-xs text-gray-500 dark:text-gray-400 mb-1">{t('create.emojiOptional')}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setOpenEmojiPicker(openEmojiPicker === option.id ? null : option.id)}
                            className="w-12 h-12 px-2 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-2xl flex items-center justify-center"
                          >
                            {option.emoji || '😶'}
                          </button>
                        </div>
                      </div>
                      {openEmojiPicker === option.id && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:absolute lg:inset-auto lg:top-full lg:left-0 lg:mt-2 lg:p-0 lg:flex lg:items-start lg:justify-start">
                          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 w-full max-w-sm lg:w-64 max-h-[80vh] overflow-y-auto relative">
                            <button
                              type="button"
                              onClick={() => setOpenEmojiPicker(null)}
                              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div className="space-y-2 mt-4">
                              {Object.entries(emojiCategories).map(([category, emojis]) => (
                                <div key={category}>
                                  <div className="text-xs text-[var(--text-muted)] capitalize mb-1">{category}</div>
                                  <div className="grid grid-cols-5 gap-1">
                                    {emojis.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                          updateOption(option.id, { emoji });
                                          setOpenEmojiPicker(null);
                                        }}
                                        className="w-10 h-10 text-xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center justify-center"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {option.emoji && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateOption(option.id, { emoji: '' });
                                      setOpenEmojiPicker(null);
                                    }}
                                    className="w-full py-2 px-3 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Trash2 size={16} />
                                    {t('create.removeEmoji')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <input
                      ref={(el) => {
                        if (el) optionFileInputRefs.current[option.id] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setOptionFileNames(prev => ({ ...prev, [option.id]: file.name }));
                          handleImageUpload(option.id, file);
                        }
                      }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => optionFileInputRefs.current[option.id]?.click()}
                        className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <CloudArrowUpIcon className="w-4 h-4" />
                        {t('ratings.upload')}
                      </button>
                      <button
                        type="button"
                        onClick={() => openImagePicker('option', option.id)}
                        className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <PhotoIcon className="w-4 h-4" />
                        {t('ratings.gallery')}
                      </button>
                      <label className="md:hidden cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setOptionFileNames(prev => ({ ...prev, [option.id]: file.name }));
                              handleImageUpload(option.id, file);
                            }
                          }}
                        />
                        <span className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2">
                          <Camera className="w-4 h-4" />
                          {t('ratings.camera')}
                        </span>
                      </label>
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">
                      {optionFileNames[option.id] || t('form.noFileChosen')}
                    </span>
                    {option.image && (
                      <div className="relative">
                        <img
                          src={option.image}
                          alt={t('create.optionPreview')}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(option.id)}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    {errors[option.id] && (
                      <p className="text-xs text-red-600">{errors[option.id]}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="flex-shrink-0 w-10 h-10 mt-1 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  disabled={options.length <= 2}
                  title={options.length <= 2 ? t('create.needAtLeast2Options') : t('create.removeOption')}
                  aria-label={t('create.removeOption') || 'Remove option'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="lg:flex lg:justify-end">
            <button
              type="button"
              onClick={addOption}
              className="mt-6 px-6 py-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors font-medium w-full lg:w-auto"
            >
              {t('create.addOption')}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>• {t('create.titleRequiredMin')}</p>
            <p>• {t('create.atLeast2OptionsRequired')}</p>
            <p>• {t('create.imagesJpgPngMax5mb')}</p>
          </div>
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`px-8 py-3 rounded-md font-medium transition-all ${
              isFormValid()
                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? t('create.creating') : (isEdit ? t('poll.save') : (pollType === 'rank' ? t('create.createRanking') : t('create.createPoll')))}
          </button>
        </div>
        
        {(submitError || errors.submit) && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-3">
              <div className="text-red-500 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">{pollType === 'rank' ? t('create.failedToCreateRanking') : t('create.failedToCreate')}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{submitError || errors.submit}</p>
                <button
                  onClick={() => {
                    setErrors(prev => ({ ...prev, submit: '' }));
                    setSubmitError(null);
                  }}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                >
                  {t('create.dismiss')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Image Picker Modal */}
        <ImagePickerModal
          isOpen={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          onSelectImage={handleImageSelect}
          title={imagePickerContext?.type === 'title' ? t('create.chooseTitleImage') : t('create.chooseOptionImage')}
        />
      </form>
    </div>
  );
}
