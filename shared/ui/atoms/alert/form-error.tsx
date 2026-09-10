'use client';

import * as React from 'react';
import { Icon } from '@/shared/ui/atoms/icons/Icon';
import { cn } from '@/shared/utils';

export interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

const FormErrorComponent = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  function FormError({ className, message, ...props }, ref) {
    if (!message) return null;

    return (
      <div
        role="alert"
        aria-live="polite"
        className="text-destructive animate-in fade-in slide-in-from-top-1 mt-1.5 flex items-center gap-1.5"
      >
        <Icon name="AlertCircle" className="h-3.5 w-3.5" />
        <p ref={ref} className={cn('text-xs font-medium', className)} {...props}>
          {message}
        </p>
      </div>
    );
  }
);

FormErrorComponent.displayName = 'FormError';

export const FormError = React.memo(FormErrorComponent);
FormError.displayName = 'FormError';
