import React from 'react';
import { Label } from '@/shared/ui/atoms/label';
import { Input } from '@/shared/ui/atoms/input';
import { RequiredMark } from '@/shared/ui/atoms/required-mark';
import { cn } from '@/shared/utils';
import { LucideIcon } from 'lucide-react';

interface StepInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  id: string;
  verified?: boolean;
  /**
   * Marks the field as required, both visually (an asterisk) and for
   * assistive tech (`aria-required` on the input, plus screen-reader-only
   * "(required)" text — WCAG 3.3.2). Mirrors the pattern already used by
   * shared/ui/molecules/FormField.tsx; StepInput lacked it even though it's
   * what every field in the live seller onboarding wizard renders through.
   */
  required?: boolean;
}

export const StepInput = React.forwardRef<HTMLInputElement, StepInputProps>(
  ({ label, icon: Icon, error, hint, id, className, verified, required, ...props }, ref) => {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={id}
            className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase"
          >
            {label}
            {required && <RequiredMark />}
          </Label>
          {verified && (
            <span
              className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-0.5 mr-1"
              data-testid={`${id}-verified-badge`}
            >
              ✓ Verified
            </span>
          )}
        </div>
        <div className="group relative">
          {Icon && (
            <div className="group-focus-within:text-primary text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transition-colors">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <Input
            id={id}
            ref={ref}
            aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
            aria-invalid={!!error}
            aria-required={required}
            className={cn(
              'bg-background/50 border-muted-foreground/20 focus:ring-primary/20 h-11 transition-all focus:ring-2',
              Icon ? 'pl-10' : '',
              error ? 'border-destructive ring-destructive/10' : 'focus:border-primary',
              className
            )}
            {...props}
          />
        </div>
        {hint && (
          <span id={hintId} className="sr-only">
            {hint}
          </span>
        )}
        {error && (
          <p
            id={errorId}
            className="text-destructive animate-in slide-in-from-top-1 ml-1 text-[10px] font-semibold tracking-tighter uppercase"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

StepInput.displayName = 'StepInput';
