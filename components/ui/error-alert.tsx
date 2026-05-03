/**
 * Error Alert Component
 * Shows error messages
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
}
