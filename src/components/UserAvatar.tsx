'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getCreatorAvatar } from '@/data/mockPolls';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base'
};

export const UserAvatar = ({ name, avatarUrl, size = 'md', className = '' }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // If no avatar URL or image failed to load, show initials
  if (!avatarUrl || imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold ${className}`}>
        {getCreatorAvatar(name)}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[var(--primary)] ${className}`}>
      {!imageLoaded && (
        <div className="w-full h-full flex items-center justify-center text-white font-semibold">
          {getCreatorAvatar(name)}
        </div>
      )}
      <Image
        src={avatarUrl}
        alt={name}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};
