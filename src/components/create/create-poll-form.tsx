'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEmptyReactions } from '@/types/poll';
import { useCreatePoll } from '@/hooks/useApi';
import { useUsername } from '@/context/UsernameContext';
import ImagePickerModal from './ImagePickerModal';
import { generateToken, generateShareLink, storePollData, getTimeRemaining, formatTimeRemaining } from '@/lib/token';
import { Trash2 } from 'lucide-react';

interface ShareResultScreenProps {
  data: { token: string; shareLink: string; expiresAt: Date };
  onBack: () => void;
  pollType: 'vote' | 'rank';
  username: string;
}

const ShareResultScreen = ({ data, onBack, pollType, username }: ShareResultScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(data.expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(data.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [data.expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[var(--surface)] rounded-xl shadow-lg border border-[var(--border)] p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
          ¡Listo {username}! Comparte el link 🎉
        </h2>
        <p className="text-[var(--text-muted)] mb-6">
          Share the link below to start collecting votes
        </p>

        {/* Share Link */}
        <div className="bg-[var(--surface-2)] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={data.shareLink}
              readOnly
              className="flex-1 bg-transparent border-none text-[var(--text)] text-sm focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--text-muted)] mb-1">Time remaining</p>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {formatTimeRemaining(timeRemaining)}
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-medium"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

type FormPollOption = {
  id: string;
  text: string;
  image: string;
  emoji?: string;
};

type Participant = {
  id: string;
  emailOrUsername: string;
};

interface CreatePollFormProps {
  defaultType?: 'vote' | 'rank';
}

export const CreatePollForm = ({ defaultType }: CreatePollFormProps) => {
  const { username } = useUsername();
  const [pollType, setPollType] = useState<'vote' | 'rank'>(defaultType || 'vote');
  const [title, setTitle] = useState('');
  const [titleImage, setTitleImage] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('24h'); // Default to 24 hours
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [options, setOptions] = useState<FormPollOption[]>([
    { id: crypto.randomUUID(), text: '', image: '' },
    { id: crypto.randomUUID(), text: '', image: '' },
  ]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerContext, setImagePickerContext] = useState<{
    type: 'title' | 'option';
    optionId?: string;
  } | null>(null);
  const [openEmojiPicker, setOpenEmojiPicker] = useState<string | null>(null);
  const [showShareScreen, setShowShareScreen] = useState(false);
  const [createdPollData, setCreatedPollData] = useState<{ token: string; shareLink: string; expiresAt: Date } | null>(null);
  const router = useRouter();
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Duration options
  const durationOptions = [
    { value: '15min', label: '15 minutes', minutes: 15 },
    { value: '30min', label: '30 minutes', minutes: 30 },
    { value: '1h', label: '1 hour', hours: 1 },
    { value: '3h', label: '3 hours', hours: 3 },
    { value: '6h', label: '6 hours', hours: 6 },
    { value: '12h', label: '12 hours', hours: 12 },
    { value: '24h', label: '24 hours', hours: 24 },
    { value: '48h', label: '48 hours', hours: 48 },
    { value: '7d', label: '7 days', hours: 168 },
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

  const { createPoll, loading, error: submitError } = useCreatePoll();

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

  const addParticipant = (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (!newParticipant.trim()) return;
    setParticipants([
      ...participants,
      { id: crypto.randomUUID(), emailOrUsername: newParticipant },
    ]);
    setNewParticipant('');
  };

  const handleImageUpload = (optionId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [optionId]: 'Only JPG and PNG images are allowed'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [optionId]: 'Image size must be less than 5MB'
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
        titleImage: 'Only JPG and PNG images are allowed'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        titleImage: 'Image size must be less than 5MB'
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
  };

  const removeTitleImage = () => {
    setTitleImage('');
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

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
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
      newErrors.title = pollType === 'rank' ? 'Ranking title is required' : 'Poll title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Options validation
    const validOptions = options.filter(option => option.text.trim() !== '');
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    } else if (validOptions.length > 10) {
      newErrors.options = 'Maximum 10 options allowed';
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.text.trim().toLowerCase());
    const duplicates = optionTexts.filter((text, index) => optionTexts.indexOf(text) !== index);
    if (duplicates.length > 0) {
      newErrors.options = 'Duplicate options are not allowed';
    }

    // Private poll validation
    if (isPrivate && participants.length === 0) {
      newErrors.participants = 'Private polls require at least one participant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Log submission data for debugging
    console.log('[CreatePoll] Submitting poll data:', {
      title: title.trim(),
      options: options.filter(option => option.text.trim() !== ''),
      type: pollType,
      isPrivate: isPrivate,
      invitedUsers: participants.map(p => p.emailOrUsername)
    });

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

      // Generate token
      const token = generateToken();
      const pollTypeForUrl = pollType === 'rank' ? 'ranking' : pollType === 'vote' ? 'vote' : 'vote';
      const shareLink = generateShareLink(token, pollTypeForUrl as 'vote' | 'ranking' | 'rating');

      // Create poll data object
      const pollData = {
        token,
        title: title.trim(),
        description: description.trim() || undefined,
        titleImage: titleImage || undefined,
        expiresAt: expiresAt.toISOString(),
        type: pollType,
        createdBy: username || 'Anonymous',
        isPrivate: isPrivate,
        invitedUsers: participants.map(p => p.emailOrUsername),
        options: options
          .filter(option => option.text.trim() !== '')
          .map(option => ({
            id: crypto.randomUUID(),
            title: option.text.trim(),
            imageUrl: option.image || undefined,
            emoji: option.emoji,
            votes: 0,
            reactions: createEmptyReactions(),
          })),
        votes: [],
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage
      storePollData(token, pollData, pollTypeForUrl as 'vote' | 'ranking' | 'rating');

      console.log('[CreatePoll] Poll created successfully with token:', token);

      // Show share screen
      setCreatedPollData({ token, shareLink, expiresAt });
      setShowShareScreen(true);
    } catch (error) {
      console.error('[CreatePoll] Failed to create poll:', error);
      setErrors({ submit: pollType === 'rank' ? 'Failed to create ranking. Please try again.' : 'Failed to create poll. Please try again.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showShareScreen && createdPollData ? (
        <ShareResultScreen
          data={createdPollData}
          pollType={pollType}
          username={username || 'Anonymous'}
          onBack={() => {
            setShowShareScreen(false);
            router.push('/');
          }}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
        {/* Poll Basics Section */}
        <div className="bg-[var(--surface)] rounded-xl shadow-md border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-6">{getContextLabel('Poll Basics')}</h2>

          <div className="space-y-6">
            {/* Poll Type Selector - Only show if defaultType is not provided */}
            {!defaultType && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-3">
                  Poll Type *
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
                      <div className="font-medium text-gray-900 dark:text-gray-100">Vote Poll</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Each person picks one option</div>
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
                      <div className="font-medium text-gray-900 dark:text-gray-100">Rank Poll</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Order all options by preference</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="title">
                {getContextLabel('Poll Title')} *
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
                  placeholder={pollType === 'rank' ? "What's your ranking about?" : "What's your poll about?"}
                  maxLength={100}
                />
                
                {/* Title Image Upload */}
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleTitleImageUpload(file);
                      }
                    }}
                    className="text-sm text-[var(--text-muted)] file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-[var(--primary)] file:cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => openImagePicker('title')}
                    className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[var(--primary)] rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium border border-[var(--primary)]"
                  >
                    📷 Search Stock Images
                  </button>
                  {titleImage && (
                    <div className="relative group">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img 
                          src={titleImage} 
                          alt="Title image preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeTitleImage}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        title="Remove title image"
                      >
                        <Trash2 size={12} />
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
              <p className="text-xs text-gray-500 dark:text-gray-400">{title.length}/100 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="description">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 min-h-[100px]"
                placeholder={pollType === 'rank' ? "Add more details about your ranking..." : "Add more details about your poll..."}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{description.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="duration">
                Expiration *
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{getContextLabel('Poll will automatically close after the selected duration')}</p>
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
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-4">{getContextLabel('Poll Options')}</h2>
          <p className="font-body text-sm text-[var(--text-muted)] mb-6">
            {pollType === 'rank' ? 'Add at least 2 options to rank. You can include text, emoji, or upload an image for each option.' : 'Add at least 2 options. You can include text, emoji, or upload an image for each option.'}
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
                      placeholder={`Option ${index + 1}`}
                      maxLength={50}
                    />
                    <div className="relative" ref={openEmojiPicker === option.id ? emojiPickerRef : null}>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Emoji (optional)</span>
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
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(option.id, file);
                        }
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-[var(--primary)] file:cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker('option', option.id)}
                      className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-[var(--primary)] rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium border border-[var(--primary)]"
                    >
                      📷 Stock Images
                    </button>
                    {option.image && (
                      <div className="relative group">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                          <img 
                            src={option.image} 
                            alt="Option preview" 
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
                  title={options.length <= 2 ? "You need at least 2 options" : "Remove option"}
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
            + Add Option
          </button>
        </div>

        {/* Visibility & Privacy Section */}
        <div className="bg-[var(--surface)] rounded-xl shadow-md border border-[var(--border)] p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-[var(--text)] mb-6">Visibility & Privacy</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="public"
                name="visibility"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="public" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Public - Anyone with the link can view and {pollType === 'rank' ? 'rank' : 'vote'}
              </label>
            </div>
            
            <div className="flex items-start">
              <input
                type="radio"
                id="private"
                name="visibility"
                checked={isPrivate}
                onChange={() => setIsPrivate(true)}
                className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 dark:border-gray-600 mt-1"
              />
              <div className="ml-2">
                <label htmlFor="private" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Private - Only invited participants can view and {pollType === 'rank' ? 'rank' : 'vote'}
                </label>
                {isPrivate && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    🔒 Only people you share the invite link with can see this {pollType === 'rank' ? 'ranking' : 'poll'}
                  </p>
                )}
                {isPrivate && participants.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Private {pollType === 'rank' ? 'rankings' : 'polls'} require at least one participant
                  </p>
                )}
                {isPrivate && (
                  <div className="mt-3 ml-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 dark:border-gray-600"
                      />
                      <label htmlFor="anonymous" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                        Anonymous voting (participants' votes are hidden)
                      </label>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">Invite Participants</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newParticipant}
                          onChange={(e) => setNewParticipant(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addParticipant(e);
                            }
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="Enter email or username"
                        />
                        <button
                          type="button"
                          onClick={() => addParticipant()}
                          className="px-6 py-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-[var(--radius-md)] hover:bg-[var(--primary)] hover:text-white transition-colors font-medium"
                        >
                          Add
                        </button>
                      </div>

                      {participants.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Invited Participants:</h4>
                          <ul className="space-y-1">
                            {participants.map((participant) => (
                              <li key={participant.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-sm">
                                <span className="text-sm text-gray-900 dark:text-gray-100">{participant.emailOrUsername}</span>
                                <button
                                  type="button"
                                  onClick={() => removeParticipant(participant.id)}
                                  className="text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Remove participant"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>• Title is required (min. 3 characters)</p>
            <p>• At least 2 options required</p>
            <p>• Images must be JPG or PNG (max 5MB)</p>
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
            {loading ? 'Creating...' : getContextLabel('Create Poll')}
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
                <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Failed to create poll</p>
                <p className="text-sm text-red-600 dark:text-red-400">{submitError?.message || errors.submit}</p>
                <button
                  onClick={() => {
                    setErrors(prev => ({ ...prev, submit: '' }));
                  }}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                >
                  Dismiss
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
          title={imagePickerContext?.type === 'title' ? 'Choose Title Image' : 'Choose Option Image'}
        />
      </form>
      )}
    </div>
  );
}
