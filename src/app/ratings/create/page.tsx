'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Trash2, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import toast from 'react-hot-toast';
import ImagePickerModal from '@/components/create/ImagePickerModal';
import { useUsername } from '@/context/UsernameContext';
import { generateShareLink } from '@/lib/token';
import { createPoll } from '@/lib/db';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('24h');
  const [items, setItems] = useState<RatingItemForm[]>([
    { id: crypto.randomUUID(), label: '', imageUrl: '' },
    { id: crypto.randomUUID(), label: '', imageUrl: '' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerContext, setImagePickerContext] = useState<{ itemId: string } | null>(null);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), label: '', imageUrl: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<RatingItemForm>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

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
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!file) return;

    setUploadingItem(itemId);

    try {
      // Convert file to base64
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    const validItems = items.filter(item => item.label.trim() !== '');
    if (validItems.length < 2) {
      newErrors.items = 'At least 2 items are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Calculate expiration date from selected duration
    const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);
    let durationMs: number;
    if (selectedOption?.minutes) {
      durationMs = selectedOption.minutes * 60 * 1000;
    } else {
      durationMs = (selectedOption?.hours || 24) * 60 * 60 * 1000;
    }
    const expiresAt = new Date(Date.now() + durationMs);

    // Create rating data object
    const options = items
      .filter(item => item.label.trim() !== '')
      .map(item => ({
        id: crypto.randomUUID(),
        title: item.label,
        imageUrl: item.imageUrl,
        locationUrl: item.locationUrl,
        comment: item.comment,
        totalRating: 0,
        ratingCount: 0,
      }));

    // Create poll via Supabase
    const token = await createPoll(
      'rating',
      title,
      username || 'Anonymous',
      expiresAt,
      options
    );

    if (!token) {
      toast.error('Error al crear la valoración');
      return;
    }

    // Redirect directly to detail page with success flag
    router.push(`/ratings/${token}?created=true`);
  };

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto pb-8">
        <>
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="hidden md:flex p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors inline-flex"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mb-6">Create Rating</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              }`}
              placeholder="e.g., Best pizza in NYC?"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500 min-h-[100px]"
              placeholder="Add more details about this rating..."
              maxLength={500}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              Duration *
            </label>
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              Items to Rate * (minimum 2)
            </label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={`Item ${index + 1}`}
                      maxLength={50}
                    />
                    <textarea
                      value={item.comment || ''}
                      onChange={(e) => updateItem(item.id, { comment: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500 min-h-[60px]"
                      placeholder="Add a comment (optional)"
                      maxLength={200}
                    />
                    <input
                      type="text"
                      value={item.locationUrl || ''}
                      onChange={(e) => updateItem(item.id, { locationUrl: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="URL de la web (opcional)"
                    />
                    {/* Image section */}
                    <div className="mt-2 space-y-2">
                      {item.imageUrl && (
                        <div className="relative">
                          <img
                            src={item.imageUrl}
                            alt={item.label}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeItemImage(item.id)}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openImagePicker(item.id)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <PhotoIcon className="w-4 h-4" />
                          Gallery
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerFileUpload(item.id)}
                          disabled={uploadingItem === item.id}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CloudArrowUpIcon className="w-4 h-4" />
                          {uploadingItem === item.id ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.imageUrl}
                        onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="O pega URL de imagen (opcional)"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 2}
                    className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={items.length <= 2 ? "You need at least 2 items" : "Remove item"}
                  >
                    <Trash2 size={20} />
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
              Add Item
            </button>
            {errors.items && <p className="mt-1 text-sm text-red-600">{errors.items}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Create Rating
          </button>
        </form>

        {/* Image Picker Modal */}
        <ImagePickerModal
          isOpen={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          onSelectImage={handleImageSelect}
          title="Choose Item Image"
        />

        {/* Hidden file input */}
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
          }}
        />
          </>
      </div>
    </PageLayout>
  );
}
