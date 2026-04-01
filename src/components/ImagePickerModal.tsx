'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { imageService, StockImage } from '@/services/imageService';

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
  title = "Choose an image" 
}: ImagePickerModalProps) => {
  const [images, setImages] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load initial images
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(''); // Clear search when opening
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async (query?: string) => {
    setLoading(true);
    try {
      // Use the query parameter directly, fallback to 'poll' if not provided
      const searchQuery = query && query.trim() !== '' ? query.trim() : 'poll';
      console.log('Loading images with query:', searchQuery); // Debug log
      const stockImages = await imageService.searchImages(searchQuery, 20);
      setImages(stockImages);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log('Search triggered with query:', searchQuery); // Debug log
    if (searchQuery.trim() === '') {
      // If search is empty, load default images
      console.log('Empty search, loading default images'); // Debug log
      loadImages('poll');
    } else {
      console.log('Searching with query:', searchQuery.trim()); // Debug log
      loadImages(searchQuery.trim());
    }
  };

  const handleClose = () => {
    setSearchQuery(''); // Clear search when closing
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
      // Use the current search query or default to 'poll'
      const currentQuery = searchQuery.trim() !== '' ? searchQuery.trim() : 'poll';
      const newImages = await imageService.searchImages(currentQuery, 20);
      setImages(prev => [...prev, ...newImages]);
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
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for images (e.g., nature, business, food...)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Images Grid */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading && images.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading images...</p>
                </div>
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
                      alt={image.author ? `Photo by ${image.author}` : 'Stock image'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                        {image.author && (
                          <p>Photo by {image.author}</p>
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
            {images.length > 0 && !loading && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Load More Images
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Images provided by free stock photo services. Always check licensing terms for commercial use.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImagePickerModal;
