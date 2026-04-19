'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export const ImageModal = ({ imageUrl, alt, onClose }: ImageModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="relative rounded-lg overflow-hidden bg-[var(--surface)]">
          <Image
            src={imageUrl}
            alt={alt}
            width={1200}
            height={800}
            className="w-full h-auto object-contain max-h-[90vh]"
            priority
          />
        </div>
      </div>
    </div>
  );
};
