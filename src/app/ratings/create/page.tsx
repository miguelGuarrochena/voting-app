'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

    // TODO: Create rating via API
    console.log('Creating rating:', {
      title,
      description,
      isPrivate,
      items: items.filter(item => item.label.trim() !== ''),
    });

    // Redirect to ratings page
    router.push('/ratings');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pt-20 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            ← Back
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
              className={`w-full px-4 py-3 border rounded-lg bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors ${
                errors.title ? 'border-red-500' : 'border-[var(--border)]'
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
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors min-h-[100px]"
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
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors"
                      placeholder={`Item ${index + 1}`}
                      maxLength={50}
                    />
                    {/* Image URL input */}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={item.imageUrl}
                        onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                        className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors text-sm"
                        placeholder="Image URL (optional)"
                      />
                      {/* TODO: Add file upload button */}
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
      </div>
    </div>
  );
}
