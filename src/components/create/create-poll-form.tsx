'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEmptyReactions } from '@/types/poll';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import ImagePickerModal from './ImagePickerModal';
import { generateShareLink } from '@/lib/token';
import { createPoll } from '@/lib/db';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';


type FormPollOption = {
  id: string;
  text: string;
  image: string;
  emoji?: string;
};

interface CreatePollFormProps {
  defaultType?: 'vote' | 'rank';
}

export default function CreatePollForm({ defaultType }: CreatePollFormProps) {
  const router = useRouter();
  const { username } = useUsername();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [pollType, setPollType] = useState<'vote' | 'rank'>(defaultType || 'vote');
  const [title, setTitle] = useState('');
  const [titleImage, setTitleImage] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('24h'); // Default to 24 hours
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [options, setOptions] = useState<FormPollOption[]>([
    { id: crypto.randomUUID(), text: '', image: '' },
    { id: crypto.randomUUID(), text: '', image: '' },
  ]);
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

    if (openEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
      // Calculate expiration date from selected duration
      const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
      let durationMs: number;
      if (selectedOption?.minutes) {
        durationMs = selectedOption.minutes * 60 * 1000;
      } else {
        durationMs = (selectedOption?.hours || 24) * 60 * 60 * 1000;
      }
      const expiresAt = new Date(Date.now() + durationMs);

      const pollTypeForUrl = pollType === 'rank' ? 'ranking' : pollType === 'vote' ? 'vote' : 'vote';
      const dbType = pollType === 'rank' ? 'ranking' : 'vote';

      // Prepare options
      const pollOptions = options
        .filter(option => option.text.trim() !== '')
        .map(option => ({
          id: crypto.randomUUID(),
          title: option.text.trim(),
          imageUrl: option.image || undefined,
          emoji: option.emoji,
          votes: 0,
          reactions: createEmptyReactions(),
        }));

      // Create poll via Supabase
      const token = await createPoll(
        dbType as 'vote' | 'ranking' | 'rating',
        title.trim(),
        username || 'Anonymous',
        expiresAt,
        pollOptions
      );

      if (!token) {
        toast.error(pollType === 'rank' ? t('create.failedRanking') : t('create.failed'));
        setLoading(false);
        return;
      }

      console.log('[CreatePoll] Poll created successfully with token:', token);

      // Redirect directly to detail page with success flag
      router.push(`/${pollTypeForUrl}/${token}?created=true`);
    } catch (error) {
      console.error('[CreatePoll] Failed to create poll:', error);
      const errorMessage = pollType === 'rank' ? t('create.failedRanking') : t('create.failed');
      setSubmitError(errorMessage);
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Poll Basics Section */}
        <div className="bg-[var(--surface)] rounded-xl shadow-md border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-6">{t('form.pollBasics')}</h2>

          <div className="space-y-6">
            {/* Poll Type Selector - Only show if defaultType is not provided */}
            {!defaultType && (
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
                <div className="flex items-center gap-3 flex-wrap">
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
                  <button
                    type="button"
                    onClick={() => titleFileInputRef.current?.click()}
                    className="text-sm px-4 py-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors font-medium border border-[var(--primary)]"
                  >
                    📎 {t('form.chooseFile')}
                  </button>
                  <span className="text-sm text-[var(--text-muted)]">
                    {titleFileName || t('form.noFileChosen')}
                  </span>
                  <button
                    type="button"
                    onClick={() => openImagePicker('title')}
                    className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[var(--primary)] rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium border border-[var(--primary)]"
                  >
                    {t('form.searchStockImages')}
                  </button>
                  {titleImage && (
                    <div className="relative group">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img 
                          src={titleImage} 
                          alt={t('form.titleImagePreview')} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeTitleImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {errors.titleImage && (
                    <p className="text-xs text-red-600">{errors.titleImage}</p>
                  )}
                </div>
              </div>
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">{title.length}/100 {t('form.characters')}</p>
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
          </div>
          
          {errors.options && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.options}</p>
            </div>
          )}
        </div>

        {/* Poll Options Section */}
        <div className="bg-[var(--surface)] rounded-xl shadow-md border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-4">{t('create.pollOptions')}</h2>
          <p className="font-body text-sm text-[var(--text-muted)] mb-6">
            {pollType === 'rank' ? t('create.addRankingOptionsDesc') : t('create.addOptionsDesc')}
          </p>

          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, { text: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('create.optionPlaceholder').replace('{n}', String(index + 1))}
                      maxLength={50}
                    />
                    <div className="relative" ref={openEmojiPicker === option.id ? emojiPickerRef : null}>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('create.emojiOptional')}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setOpenEmojiPicker(openEmojiPicker === option.id ? null : option.id)}
                            className="w-12 h-12 px-2 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-2xl flex items-center justify-center"
                          >
                            {option.emoji || '😶'}
                          </button>
                          {option.emoji && (
                            <button
                              type="button"
                              onClick={() => updateOption(option.id, { emoji: '' })}
                              className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 text-sm font-bold rounded-full hover:bg-red-50 transition-colors"
                              title="Clear emoji"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {openEmojiPicker === option.id && (
                        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 w-64">
                          <div className="space-y-2">
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
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
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
                    <button
                      type="button"
                      onClick={() => optionFileInputRefs.current[option.id]?.click()}
                      className="text-sm px-4 py-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors font-medium border border-[var(--primary)]"
                    >
                      📎 {t('form.chooseFile')}
                    </button>
                    <span className="text-sm text-[var(--text-muted)]">
                      {optionFileNames[option.id] || t('form.noFileChosen')}
                    </span>
                    <button
                      type="button"
                      onClick={() => openImagePicker('option', option.id)}
                      className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[var(--primary)] rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium border border-[var(--primary)]"
                    >
                      📷 {t('create.stockImages')}
                    </button>
                    {option.image && (
                      <div className="relative group">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                          <img 
                            src={option.image} 
                            alt={t('create.optionPreview')} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(option.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 size={12} />
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
                  className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  disabled={options.length <= 2}
                  title={options.length <= 2 ? t('create.needAtLeast2Options') : t('create.removeOption')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addOption}
            className="mt-6 px-6 py-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors font-medium"
          >
            {t('create.addOption')}
          </button>
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
            {loading ? t('create.creating') : (pollType === 'rank' ? t('create.createRanking') : t('create.createPoll'))}
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
