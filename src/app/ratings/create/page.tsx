'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Trash2, ArrowLeft, Camera, SlidersHorizontal } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import toast from 'react-hot-toast';
import ImagePickerModal from '@/components/create/ImagePickerModal';
import { useUsername } from '@/context/UsernameContext';
import { useLanguage } from '@/context/LanguageContext';
import { createPoll } from '@/lib/db';
import { addMyPoll } from '@/lib/mypolls';
import { safeBack } from '@/lib/navigation';
import { AnonCreateModal } from '@/components/auth/AnonCreateModal';
import { RatingsComingSoon } from '@/components/ratings/ComingSoon';
import { FEATURES } from '@/lib/features';
import {
  attachAttributesToOptions,
  newAttrId,
  type RatingAttribute,
} from '@/lib/ratings';

type RatingItemForm = {
  id: string;
  label: string;
  imageUrl: string;
  locationUrl?: string;
  comment?: string;
};

export default function CreateRatingPage() {
  const router = useRouter();
  const { username } = useUsername();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('24h');
  // We now start with a single item (used to be 2 forced).
  const [items, setItems] = useState<RatingItemForm[]>([
    { id: crypto.randomUUID(), label: '', imageUrl: '' },
  ]);
  // Global attributes for the rating. Default to one ("Overall").
  const [attributes, setAttributes] = useState<RatingAttribute[]>([
    { id: newAttrId(), label: t('ratings.defaultAttribute') || 'Overall' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerContext, setImagePickerContext] = useState<{ itemId: string } | null>(null);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [itemFileNames, setItemFileNames] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Items CRUD
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: '', imageUrl: '' },
    ]);
  };

  const removeItem = (id: string) => {
    // At least 1 item — deletion is allowed down to 1.
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<RatingItemForm>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Attributes CRUD
  const addAttribute = () => {
    setAttributes((prev) => [...prev, { id: newAttrId(), label: '' }]);
  };

  const removeAttribute = (id: string) => {
    if (attributes.length <= 1) return; // there must always be at least 1
    setAttributes((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAttribute = (id: string, label: string) => {
    setAttributes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, label } : a))
    );
  };

  // Images
  const openImagePicker = (itemId: string) => {
    setImagePickerContext({ itemId });
    setImagePickerOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (imagePickerContext?.itemId) {
      updateItem(imagePickerContext.itemId, { imageUrl });
    }
    setImagePickerContext(null);
    setImagePickerOpen(false);
  };

  const removeItemImage = (itemId: string) => {
    updateItem(itemId, { imageUrl: '' });
    setItemFileNames((prev) => ({ ...prev, [itemId]: '' }));
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!file) return;

    setUploadingItem(itemId);
    setItemFileNames((prev) => ({ ...prev, [itemId]: file.name }));

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        updateItem(itemId, { imageUrl: base64Url });
        setUploadingItem(null);
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setUploadingItem(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingItem(null);
    }
  };

  const triggerFileUpload = (itemId: string) => {
    setImagePickerContext({ itemId });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Validation
  const computeErrors = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = t('ratings.titleRequired');
    } else if (title.trim().length < 3) {
      newErrors.title = t('ratings.titleMinLength');
    }

    const validItems = items.filter((item) => item.label.trim() !== '');
    if (validItems.length < 1) {
      newErrors.items = t('ratings.atLeast1ItemRequired');
    } else {
      // Same case-insensitive duplicate check we already do for attributes,
      // mirrored over to item names. Without this the create button stays
      // enabled with two items called "Pizza Hut" and the user only sees
      // the error on submit (or worse, never).
      const itemLabelsLower = validItems.map((it) => it.label.trim().toLowerCase());
      const dupItems = itemLabelsLower.filter(
        (l, i) => itemLabelsLower.indexOf(l) !== i
      );
      if (dupItems.length > 0) {
        newErrors.items = t('ratings.duplicateItems');
      }
    }

    const cleanAttrs = attributes
      .map((a) => ({ ...a, label: a.label.trim() }))
      .filter((a) => a.label);
    if (cleanAttrs.length < 1) {
      newErrors.attributes = t('ratings.needAtLeastOneAttribute');
    }
    const labelsLower = cleanAttrs.map((a) => a.label.toLowerCase());
    const dupes = labelsLower.filter(
      (l, i) => labelsLower.indexOf(l) !== i
    );
    if (dupes.length > 0) {
      newErrors.attributes = t('ratings.duplicateAttribute');
    }

    return newErrors;
  };

  const validateForm = () => {
    const newErrors = computeErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = Object.keys(computeErrors()).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const selectedOption = durationOptions.find(
        (opt) => opt.value === selectedDuration
      );
      let durationMs: number;
      if (selectedOption?.minutes) {
        durationMs = selectedOption.minutes * 60 * 1000;
      } else {
        durationMs = (selectedOption?.hours || 24) * 60 * 60 * 1000;
      }
      const expiresAt = new Date(Date.now() + durationMs);

      // Build options
      const baseOptions = items
        .filter((item) => item.label.trim() !== '')
        .map((item) => ({
          id: crypto.randomUUID(),
          title: item.label.trim(),
          imageUrl: item.imageUrl,
          locationUrl: item.locationUrl,
          comment: item.comment,
          totalRating: 0,
          ratingCount: 0,
        }));

      // Attach the global attributes to each option (lectura siempre
      // por options[0].attributes — ver lib/ratings.ts).
      const cleanAttrs: RatingAttribute[] = attributes
        .map((a) => ({ id: a.id, label: a.label.trim() }))
        .filter((a) => a.label);

      const options = attachAttributesToOptions(baseOptions, cleanAttrs);

      const token = await createPoll(
        'rating',
        title,
        username || 'Anonymous',
        expiresAt,
        options,
        { description: description.trim() || undefined }
      );

      if (!token) {
        toast.error(t('ratings.failedToCreate'));
        return;
      }

      addMyPoll({
        token,
        type: 'rating',
        title: title.trim(),
        role: 'creator',
        createdBy: username || 'Anonymous',
        expiresAt: expiresAt.toISOString(),
      });

      router.replace(`/ratings/${token}?created=true`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout className="pb-24 md:pb-8">
      {!FEATURES.ratings && <RatingsComingSoon />}
      {/*
        Layout note (mobile):
        - we add px-4 on the wrapper so the cards don't touch the edge
          of the screen.
        - max-w-2xl + mx-auto centers on desktop.
      */}
      <div className="max-w-2xl mx-auto px-4 sm:px-0 pb-8">
        <div className="mb-6">
          <button
            onClick={() => safeBack(router, '/ratings')}
            className="hidden md:flex items-center gap-2 p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">
              {t('common.back')}
            </span>
          </button>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-6 break-words">
          {t('ratings.createRating')}
        </h1>

        <AnonCreateModal />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('ratings.titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full min-w-0 px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder={t('ratings.titlePlaceholder')}
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('ratings.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-w-0 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 min-h-[100px] resize-y"
              placeholder={t('ratings.descriptionPlaceholder')}
              maxLength={500}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('ratings.durationLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedDuration(option.value)}
                  className={`px-2 py-2 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium truncate ${
                    selectedDuration === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] dark:bg-[var(--primary-light)/20] text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attributes (rating criteria) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text)] mb-1">
              <SlidersHorizontal className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
              <span>{t('ratings.attributesLabel')}</span>
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-snug">
              {t('ratings.attributesHint')}
            </p>
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div
                  key={attr.id}
                  className="flex items-center gap-2 min-w-0"
                >
                  <input
                    type="text"
                    value={attr.label}
                    onChange={(e) => updateAttribute(attr.id, e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={`${t('ratings.attributePlaceholder')} ${index + 1}`}
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttribute(attr.id)}
                    disabled={attributes.length <= 1}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('ratings.removeAttribute')}
                    title={
                      attributes.length <= 1
                        ? t('ratings.needAtLeastOneAttribute')
                        : t('ratings.removeAttribute')
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="mt-3 px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium flex items-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              {t('ratings.addAttribute')}
            </button>
            {errors.attributes && (
              <p className="mt-2 text-sm text-red-600">{errors.attributes}</p>
            )}
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              {t('ratings.itemsToRateLabel')}
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-snug">
              {t('ratings.itemsToRateHint')}
            </p>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 sm:gap-3 min-w-0"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) =>
                        updateItem(item.id, { label: e.target.value })
                      }
                      className="w-full min-w-0 px-3 sm:px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('ratings.itemPlaceholder').replace(
                        '{n}',
                        String(index + 1)
                      )}
                      maxLength={50}
                    />
                    <textarea
                      value={item.comment || ''}
                      onChange={(e) =>
                        updateItem(item.id, { comment: e.target.value })
                      }
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500 min-h-[60px] resize-y"
                      placeholder={t('ratings.commentPlaceholder')}
                      maxLength={200}
                    />
                    <input
                      type="text"
                      value={item.locationUrl || ''}
                      onChange={(e) =>
                        updateItem(item.id, { locationUrl: e.target.value })
                      }
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('ratings.locationUrlPlaceholder')}
                    />

                    {/* Image preview */}
                    {item.imageUrl && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.label}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeItemImage(item.id)}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/55 hover:bg-black/75 rounded-full flex items-center justify-center text-white transition-colors"
                          aria-label={t('common.delete') || 'Remove'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    {/* Image source buttons — stack on mobile, row on >=sm */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerFileUpload(item.id)}
                        disabled={uploadingItem === item.id}
                        className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CloudArrowUpIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {uploadingItem === item.id
                            ? t('ratings.uploading')
                            : t('ratings.upload')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openImagePicker(item.id)}
                        className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <PhotoIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{t('ratings.gallery')}</span>
                      </button>
                      <label className="cursor-pointer w-full min-w-0">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(item.id, file);
                            }
                            e.target.value = '';
                          }}
                        />
                        <span
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                          style={{
                            pointerEvents:
                              uploadingItem === item.id ? 'none' : 'auto',
                          }}
                        >
                          <Camera className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{t('ratings.camera')}</span>
                        </span>
                      </label>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] block truncate">
                      {itemFileNames[item.id] || t('form.noFileChosen')}
                    </span>
                    <input
                      type="text"
                      value={item.imageUrl}
                      onChange={(e) =>
                        updateItem(item.id, { imageUrl: e.target.value })
                      }
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('ratings.imageUrlPlaceholder')}
                    />
                  </div>
                  {/* Delete item button — fijo, NO se corta en mobile */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="flex-shrink-0 w-10 h-10 mt-1 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('ratings.removeItem')}
                    title={
                      items.length <= 1
                        ? t('ratings.needAtLeast1Item')
                        : t('ratings.removeItem')
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 px-4 py-2 bg-[var(--surface-2)] text-[var(--primary)] rounded-lg hover:bg-[var(--surface)] transition-colors font-medium flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              {t('ratings.addItem')}
            </button>
            {errors.items && (
              <p className="mt-1 text-sm text-red-600">{errors.items}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              submitting || !isFormValid
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:shadow-lg'
            }`}
          >
            {submitting ? '…' : t('ratings.createRating')}
          </button>
        </form>

        {/* Image Picker Modal */}
        <ImagePickerModal
          isOpen={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          onSelectImage={handleImageSelect}
          title={t('ratings.chooseItemImage')}
        />

        {/* Hidden file input (Upload) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && imagePickerContext?.itemId) {
              handleFileUpload(imagePickerContext.itemId, file);
            }
            e.target.value = '';
          }}
        />
      </div>
    </PageLayout>
  );
}
