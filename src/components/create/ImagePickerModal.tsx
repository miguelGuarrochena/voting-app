'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { imageService, StockImage } from '@/services/imageService';
import { useLanguage } from '@/context/LanguageContext';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  title?: string;
}

// Skeleton box used during initial load + load-more. Same aspect-ratio
// and rounding as the real cards so the layout doesn't jump when the
// data arrives. Tailwind's animate-pulse gives a smooth fade in/out.
const SkeletonBox = () => (
  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse" />
);

// Single image item with fade-in. Each <img> starts at opacity-0 and
// transitions to opacity-100 once onLoad fires. Until then we show the
// gray placeholder with animate-pulse at the same aspect-ratio. This
// avoids the ugly "pop-in" of images appearing one by one out of sync.
interface ImagePickerItemProps {
  image: StockImage;
  isSelected: boolean;
  altText: string;
  authorLabel: string | null;
  onClick: () => void;
}

const ImagePickerItem = ({ image, isSelected, altText, authorLabel, onClick }: ImagePickerItemProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
      onClick={onClick}
    >
      {/* Gray placeholder with pulse until the image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={image.thumbnail}
        alt={altText}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        // onError doesn't break the grid: we just leave the placeholder
        // visible. When Pexels fails on a specific thumb, the rest of
        // the grid keeps working.
        onError={() => setLoaded(false)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
          {authorLabel && <p>{authorLabel}</p>}
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
};

const ImagePickerModal = ({ isOpen, onClose, onSelectImage, title }: ImagePickerModalProps) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<StockImage[]>([]);
  const modalTitle = title || t('common.chooseImage');

  // Two separate loading states:
  // - isLoading: first load / new search. Blocks the grid and shows full skeletons.
  // - isLoadingMore: pagination. Doesn't block the grid; shows skeletons at the
  //   bottom plus a spinner on the button.
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track the last "active" query so handleLoadMore can use it. If the user
  // searched "food" and then hit Load More, we want to paginate within
  // "food", not fall back to curated. searchQuery may have changed via the
  // input before the debounce fires; activeQuery only updates after a
  // successful search.
  const activeQueryRef = useRef<string>('');

  const runSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(false);
    setPage(1);
    activeQueryRef.current = query;
    try {
      const results = await imageService.searchImages(query, 20, 1);
      setImages(results);
    } catch (err) {
      console.error('Error searching images:', err);
      setImages([]);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInitial = useCallback(() => runSearch(''), [runSearch]);

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce: wait 500ms after the last keystroke so we don't hammer
    // Pexels with a request per character.
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        setSelectedCategory(null);
        runSearch(value.trim());
      } else {
        loadInitial();
      }
    }, 500);
  };

  // Load initial images when the modal opens.
  useEffect(() => {
    if (isOpen) {
      loadInitial();
    }
    // intentional: only run when isOpen flips to true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Clear the pending timeout on unmount.
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const categories = [
    { key: 'nature', query: 'nature' },
    { key: 'cities', query: 'city' },
    { key: 'food', query: 'food' },
    { key: 'sports', query: 'sports' },
    { key: 'technology', query: 'technology' },
    { key: 'art', query: 'art' },
    { key: 'animals', query: 'animals' },
    { key: 'travel', query: 'travel' },
  ];

  const handleCategoryClick = async (category: { key: string; query: string }) => {
    if (selectedCategory === category.key) {
      // Toggle off: go back to curated
      setSelectedCategory(null);
      setSearchQuery('');
      loadInitial();
    } else {
      setSelectedCategory(category.key);
      setSearchQuery(category.query);
      runSearch(category.query);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleSelectImage = (image: StockImage) => {
    setSelectedImage(image.url);
    onSelectImage(image.url);
    handleClose();
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const newImages = await imageService.searchImages(activeQueryRef.current, 20, nextPage);
      setImages((prev) => {
        const existingIds = new Set(prev.map((img) => img.id));
        const newUnique = newImages.filter((img) => !existingIds.has(img.id));
        return [...prev, ...newUnique];
      });
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more images:', err);
      // For load-more we don't trip the global grid error (we want to
      // keep the already-loaded images visible). Just log it; the user
      // can retry by tapping Load More again.
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRetry = () => {
    if (searchQuery.trim()) {
      runSearch(searchQuery.trim());
    } else {
      loadInitial();
    }
  };

  if (!isOpen) return null;

  // Decide what to render in the grid area:
  // 1) Initial loading → 8 skeletons
  // 2) Error → message + retry
  // 3) Empty (no results) → message
  // 4) Default → grid + (if load-more is active) 4 skeletons at the end
  const renderGridContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBox key={`initial-skeleton-${i}`} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <svg
            className="w-12 h-12 text-[var(--text-muted)] mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">
            {t('common.imagePicker.errorTitle')}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            {t('common.imagePicker.errorHint')}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors text-sm font-medium"
          >
            {t('common.imagePicker.retry')}
          </button>
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <svg
            className="w-12 h-12 text-[var(--text-muted)] mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-semibold text-[var(--text)] mb-1">
            {t('common.imagePicker.noResults')}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {t('common.imagePicker.noResultsHint')}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <ImagePickerItem
              key={image.id}
              image={image}
              isSelected={selectedImage === image.url}
              altText={
                image.author
                  ? t('common.photoBy').replace('{author}', image.author)
                  : t('common.imagePicker.stockImageAlt')
              }
              authorLabel={
                image.author ? t('common.photoBy').replace('{author}', image.author) : null
              }
              onClick={() => handleSelectImage(image)}
            />
          ))}
          {/* Load-more skeletons are appended at the end of the grid */}
          {isLoadingMore &&
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={`more-skeleton-${i}`} />
            ))}
        </div>

        {/* Load More button: visible when we have images AND we're not in
            initial loading. We show it for searches/categories too — Pexels
            paginates those results just the same. */}
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
              isLoadingMore
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>{t('common.imagePicker.loadingMore')}</span>
              </>
            ) : (
              <span>{t('common.loadMoreImages')}</span>
            )}
          </button>
        </div>
      </>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-75 z-[9999] flex items-center justify-center"
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--surface)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--text)]">{modalTitle}</h2>
              <button
                onClick={handleClose}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label={t('common.close')}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  placeholder={t('common.imagePicker.searchPlaceholder')}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-[var(--surface)] text-[var(--text)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-4 py-2 rounded-full border text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-[var(--surface)] text-[var(--text)] border-gray-300 dark:border-gray-600 hover:border-[var(--primary)]'
                  }`}
                >
                  {t(`common.imagePicker.category.${category.key}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Images Grid / Error / Empty */}
          <div className="p-6 overflow-y-auto flex-1">{renderGridContent()}</div>

          {/* Footer */}
          <div className="border-t border-[var(--border)] p-4 bg-[var(--surface)]">
            <p className="text-xs text-[var(--text-muted)] text-center">
              {t('common.imageAttribution')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImagePickerModal;
