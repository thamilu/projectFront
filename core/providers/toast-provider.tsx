/**
 * Toast Provider
 * 
 * Provides toast notifications using sonner library.
 * Handles success, error, warning, and info messages.
 * 
 * @module components/providers/toast-provider
 */

'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Toast Provider Component
 * 
 * Integrates sonner toast notifications with theme support.
 * 
 * @example
 * ```tsx
 * import { toast } from 'sonner';
 * 
 * toast.success('Operation successful!');
 * toast.error('Something went wrong');
 * ```
 */
export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      theme={theme as 'light' | 'dark' | 'system'}
      closeButton
      richColors
      expand={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'group toast',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-muted text-muted-foreground hover:bg-muted/80',
        },
      }}
    />
  );
}
