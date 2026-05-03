import { cn } from '@/lib/utils';

interface AppleIconProps {
  className?: string;
  /** When provided, icon becomes semantic with accessible label */
  'aria-label'?: string;
}

export function AppleIcon({ className, 'aria-label': ariaLabel }: AppleIconProps) {
  const isDecorative = !ariaLabel;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('h-6 w-6 shrink-0', className)}
      aria-hidden={isDecorative}
      aria-label={ariaLabel}
      role={isDecorative ? undefined : 'img'}
      focusable="false"
    >
      <path d="M17.564 13.307c-.025-2.568 2.099-3.8 2.192-3.858-1.197-1.748-3.06-1.99-3.715-2.017-1.58-.16-3.086.927-3.89.927-.803 0-2.034-.904-3.35-.88-1.724.025-3.324 1.004-4.215 2.553-1.797 3.116-.459 7.73 1.29 10.26.857 1.23 1.872 2.61 3.21 2.56 1.297-.051 1.785-.828 3.35-.828 1.564 0 1.995.828 3.35.803 1.388-.025 2.26-1.254 3.11-2.486.98-1.426 1.385-2.81 1.41-2.88-.03-.014-2.71-1.04-2.74-4.03zm-3.23-7.8c.71-.86 1.19-2.06 1.06-3.26-1.02.04-2.25.68-2.98 1.54-.65.75-1.22 1.95-1.01 3.1 1.13.09 2.29-.57 2.93-1.38z" />
    </svg>
  );
}
