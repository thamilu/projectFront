export const LOADING_CONFIG = {
  sizes: {
    sm: {
      spinner: 'h-8 w-8 border-2',
      text: 'text-xs',
      gap: 'gap-2',
    },
    md: {
      spinner: 'h-12 w-12 border-2',
      text: 'text-sm',
      gap: 'gap-4',
    },
    lg: {
      spinner: 'h-16 w-16 border-4',
      text: 'text-base',
      gap: 'gap-6',
    },
  },
  animations: {
    duration: {
      spin: '1s',
      pulse: '2s',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  timeout: {
    default: 30000,
    warning: 5000,
  },
} as const;

export type LoadingSize = keyof typeof LOADING_CONFIG.sizes;
