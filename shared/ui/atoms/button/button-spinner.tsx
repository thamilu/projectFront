import * as React from 'react';
import { cn } from '@/shared/utils';
import { type ButtonSpinnerProps } from './button.types';

const spinSpeedMap = {
  slow: 'motion-safe:animate-[spin_1.5s_linear_infinite]',
  normal: 'motion-safe:animate-spin',
  fast: 'motion-safe:animate-[spin_0.5s_linear_infinite]',
} as const;

export const ButtonSpinner = ({ speed = 'normal', className, ...props }: ButtonSpinnerProps) => (
  <svg
    className={cn(
      spinSpeedMap[speed],
      'motion-reduce:animate-none motion-reduce:opacity-70',
      className
    )}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    role="presentation"
    tabIndex={-1}
    data-slot="button-spinner"
    {...props}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 
         7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
ButtonSpinner.displayName = 'Button.Spinner';
