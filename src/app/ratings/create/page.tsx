'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, XMarkIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { PageLayout } from '@/components/PageLayout';
import ImagePickerModal from '@/components/create/ImagePickerModal';

type RatingItemForm = {
  id: string;
  label: string;
  imageUrl: string;
};

export default function CreateRatingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [items, setItems] = useState<RatingItemForm[]>([
    { id: crypto.randomUUID(), label: '', imageUrl: '' },
    { id: crypto.randomUUID(), label: '', imageUrl: '' },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerContext, setImagePickerContext] = useState<{ itemId: string } | null>(null);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Create rating object
    const newRating = {
      id: crypto.randomUUID(),
      title,
      description,
      isPrivate,
      visibility: isPrivate ? 'private' : 'public',
      createdAt: new Date().toISOString(),
      createdBy: 'current-user', // In a real app, this would come from auth
      items: items
        .filter(item => item.label.trim() !== '')
        .map(item => ({
          id: crypto.randomUUID(),
          ratingId: crypto.randomUUID(),
          label: item.label,
          imageUrl: item.imageUrl,
          votes: []
        }))
    };

    // Save to localStorage (in a real app, this would be an API call)
    const existingRatings = JSON.parse(localStorage.getItem('ratings') || '[]');
    localStorage.setItem('ratings', JSON.stringify([...existingRatings, newRating]));

    // Redirect to ratings page
    router.push('/ratings');
  };

  return (
    <PageLayout className="pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto pb-8">
        <div className="py-0 sm:py-6">
          <Link
            href="/ratings"
            className="hidden sm:block text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back
          </Link>
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

          {/* Privacy */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)]"
            />
            <label htmlFor="private" className="ml-2 block text-sm text-[var(--text)]">
              Private - Only you can see this rating
            </label>
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
                    {/* Image section */}
                    <div className="mt-2">
                      {item.imageUrl ? (
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
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
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
                            placeholder="Or paste URL (for places/stores)"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 2}
                    className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={items.length <= 2 ? "You need at least 2 items" : "Remove item"}
                  >
                    <XMarkIcon className="w-5 h-5" />
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
      </div>
    </PageLayout>
  );
}
