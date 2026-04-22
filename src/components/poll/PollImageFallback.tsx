'use client';

import { useState, useEffect, useCallback } from 'react';
import { imageService } from '@/services/imageService';

interface PollImageFallbackProps {
  title?: string;
  category?: string;
  className?: string;
  children?: React.ReactNode;
  fallbackType?: 'gradient' | 'stock' | 'placeholder';
}

const PollImageFallback = ({ 
  title, 
  category, 
  className = '', 
  children,
  fallbackType = 'gradient'
}: PollImageFallbackProps) => {
  const [fallbackImage, setFallbackImage] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  // Generate gradient based on title
  const getGradient = (text?: string) => {
    const gradients = [
      'linear-gradient(135deg, #FF6B6B, #FFE66D)',
      'linear-gradient(135deg, #4ECDC4, #44A08D)',
      'linear-gradient(135deg, #45B7D1, #2196F3)',
      'linear-gradient(135deg, #F7DC6F, #F39C12)',
      'linear-gradient(135deg, #BB8FCE, #8E44AD)',
      'linear-gradient(135deg, #85C1E2, #3498DB)',
      'linear-gradient(135deg, #F8B500, #FF6B6B)',
      'linear-gradient(135deg, #00B4DB, #0083B0)',
    ];
    
    if (!text) return gradients[0];
    const index = text.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  // Load fallback stock image
  const loadStockImage = useCallback(async () => {
    try {
      const images = await imageService.getPollPlaceholders(1);
      if (images.length > 0) {
        setFallbackImage(images[0].url);
      }
    } catch (error) {
      console.error('Error loading fallback image:', error);
    }
  }, []);

  useEffect(() => {
    if (fallbackType === 'stock' && !fallbackImage && (imageError || !children)) {
      loadStockImage();
    }
  }, [fallbackType, imageError, children, fallbackImage, loadStockImage]);

  const handleImageError = () => {
    setImageError(true);
  };

  // If children exist and no error, show children
  if (children && !imageError) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  // Show gradient fallback
  if (fallbackType === 'gradient' || (fallbackType === 'stock' && !fallbackImage)) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ background: getGradient(title || category) }}
      >
        <div className="text-white text-center p-4">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-lg font-medium">
            {title ? title.charAt(0).toUpperCase() : 'P'}
          </div>
        </div>
      </div>
    );
  }

  // Show stock image fallback
  return (
    <div className={className}>
      {fallbackImage ? (
        <img 
          src={fallbackImage} 
          alt={title || 'Poll image'}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        // Final fallback to gradient if stock image fails
        <div 
          className="flex items-center justify-center w-full h-full"
          style={{ background: getGradient(title || category) }}
        >
          <div className="text-white text-center p-4">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-lg font-medium">
              {title ? title.charAt(0).toUpperCase() : 'P'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollImageFallback;
