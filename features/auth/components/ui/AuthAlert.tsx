import * as React from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/shared/utils';

interface AuthAlertProps {
  variant: 'error' | 'warning';
  title: string;
  description: string;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}

export const AuthAlert = React.forwardRef<HTMLDivElement, AuthAlertProps>(function AuthAlert(
  { variant, title, description, onDismiss, className, id },
  ref
) {
  const isError = variant === 'error';
  const Icon = isError ? AlertCircle : AlertTriangle;

  return (
    <div
      ref={ref}
      // Programmatically focusable (not in tab order) so callers can move
      // keyboard/AT focus to newly-appeared alerts (WCAG 2.2 SC 2.4.3 / 4.1.3).
      tabIndex={-1}
      role="alert"
      aria-live={isError ? 'assertive' : 'polite'}
      className={cn(
        'relative mb-6 flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isError
          ? 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/20 dark:bg-destructive/10 focus-visible:ring-destructive'
          : 'border-warning/30 bg-warning/10 text-warning dark:border-warning/20 dark:bg-warning/10 focus-visible:ring-warning',
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />

      <div className="flex-1">
        <h5 className="text-sm leading-none font-semibold tracking-tight">{title}</h5>
        <p id={id} className="mt-1.5 text-xs leading-relaxed opacity-90">
          {description}
        </p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          className={cn(
            'rounded-md p-1 opacity-70 transition-all hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none',
            isError
              ? 'focus:ring-destructive hover:bg-destructive/10'
              : 'focus:ring-warning hover:bg-warning/10'
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
});
