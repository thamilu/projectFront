import React from 'react';
import { cn } from '@/shared/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({ children, className, size = 'lg' }: PageContainerProps) {
  return (
    <div className="from-background to-muted/20 min-h-screen bg-gradient-to-b">
      <div
        className={cn(
          'container mx-auto px-4 py-6 md:py-8',
          sizeClasses[size],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
