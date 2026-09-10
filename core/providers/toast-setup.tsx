import { Toaster } from 'sonner';

/**
 * Global toast notification system using Sonner.
 *
 * Note: ToastProvider was removed as Sonner's Toaster is self-contained.
 * The imperative toast() API works globally without additional context.
 */
export function ToastSetup() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          error: 'bg-destructive text-destructive-foreground',
          success: 'bg-success text-success-foreground',
          warning: 'bg-warning text-warning-foreground',
          info: 'bg-info text-info-foreground',
        },
      }}
    />
  );
}
