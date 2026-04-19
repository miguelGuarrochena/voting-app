'use client';

import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

export function PageLayout({ children, className = '', fullWidth = false, style }: PageLayoutProps) {
  return (
    <div
      className={`min-h-screen bg-[var(--bg)] pt-[var(--navbar-height)] ${className}`}
      style={style || { paddingTop: 'calc(var(--navbar-height) + 1.5rem)' }} // navbar height + 24px padding
    >
      <div className={fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        {children}
      </div>
    </div>
  );
}
