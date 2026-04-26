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

const ImagePickerModal = ({
  isOpen,
  onClose,
  onSelectImage,
  title
}: ImagePickerModalProps) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<StockImage[]>([]);
  const modalTitle = title || t('common.chooseImage');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      // Load curated photos as default
      const stockImages = await imageService.searchImages('', 20, 1);
      setImages(stockImages);
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setPage(1);
    try {
      const searchResults = await imageService.searchImages(query, 20, 1);
      setImages(searchResults);
    } catch (error) {
      console.error('Error searching images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear timeout if exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
        setSelectedCategory(null); // Clear category when typing
      } else {
        loadImages(); // Load curated when empty
      }
    }, 500);
  };

  // Load initial images
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, loadImages]);

  // Cleanup timeout on unmount
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
    { key: 'travel', query: 'travel' }
  ];

  const handleCategoryClick = async (category: { key: string; query: string }) => {
    if (selectedCategory === category.key) {
      // Deselect category and load curated photos
      setSelectedCategory(null);
      setSearchQuery('');
      loadImages();
    } else {
      // Select category and fill search input
      setSelectedCategory(category.key);
      setSearchQuery(category.query);
      handleSearch(category.query);
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
    setLoading(true);
    try {
      const nextPage = page + 1;
      setPage(nextPage);
      // Load more curated photos
      const newImages = await imageService.searchImages('', 20, nextPage);
      setImages(prev => {
        const existingIds = new Set(prev.map(img => img.id));
        const newUnique = newImages.filter(img => !existingIds.has(img.id));
        return [...prev, ...newUnique];
      });
    } catch (error) {
      console.error('Error loading more images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          padding: 0
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
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  placeholder="Search... / Buscar..."
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

          {/* Images Grid */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading && images.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('common.loadingImages')}</p>
                </div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">{t('common.imagePicker.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <motion.div
                    key={image.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
                    onClick={() => handleSelectImage(image)}
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.author ? t('common.photoBy').replace('{author}', image.author) : 'Stock image'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                        {image.author && (
                          <p>{t('common.photoBy').replace('{author}', image.author)}</p>
                        )}
                      </div>
                    </div>
                    {selectedImage === image.url && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {images.length > 0 && !loading && !searchQuery && !selectedCategory && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.loadMoreImages')}
                </button>
              </div>
            )}
          </div>

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
