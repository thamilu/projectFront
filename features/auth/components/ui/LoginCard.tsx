'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';

interface LoginCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Premium glassmorphic card container for Keycloak authentication.
 * Employs safe compositor transitions (opacity, transform, shadow) instead of transition-all
 * to prevent layout recalculation frames and ensure 60fps performance on lower-end hardware.
 */
export function LoginCard({ children, className }: LoginCardProps) {
  return (
    <article
      className={cn(
        'border-border/60 rounded-2xl border bg-white/70 p-8 shadow-xl backdrop-blur-xl',
        'transition-[opacity,transform,box-shadow] duration-200 ease-out',
        'dark:border-zinc-800/80 dark:bg-zinc-900/65',
        className
      )}
    >
      {children}
    </article>
  );
}
