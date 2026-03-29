import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    className
  ].filter(Boolean).join(' ');

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={classes}
            style={{
              ...style,
              width: index === lines - 1 ? '70%' : style.width
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={classes} style={style} />;
};

// Poll card skeleton component
export const PollCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-[24px] shadow-[var(--shadow-sm)] overflow-hidden border border-[var(--border)]">
    <Skeleton variant="rectangular" height={200} />
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={100} />
        </div>
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <div className="space-y-3">
        <Skeleton variant="text" />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="rectangular" height={8} />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={50} />
      </div>
    </div>
  </div>
);

// Loading spinner component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-[var(--primary)] ${sizeClasses[size]}`}
      />
    </div>
  );
};
