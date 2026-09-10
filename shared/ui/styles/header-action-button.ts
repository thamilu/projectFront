import { cn } from '@/shared/utils';

/**
 * Base className for all header action buttons.
 * Ensures visual consistency and WCAG 2.4.7 focus compliance.
 * Do NOT apply focus:outline-none — only focus-visible:outline-none.
 */
export const HEADER_ACTION_BUTTON_CLASS = cn(
  'text-xs font-semibold px-3 h-9 rounded-xl',
  'border border-border/50 hover:bg-accent',
  'text-muted-foreground hover:text-foreground',
  'flex items-center gap-1.5 transition-colors',
  'focus-visible:ring-2 focus-visible:ring-primary',
  'focus-visible:outline-none'
);
