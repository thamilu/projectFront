import { forwardRef, type SVGProps } from 'react';
import { cn } from '@/lib/utils';

export interface GooglePlayIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** When provided, icon becomes semantic with accessible label and native tooltip */
  'aria-label'?: string;
}

export const GooglePlayIcon = forwardRef<SVGSVGElement, GooglePlayIconProps>(
  ({ className, 'aria-label': ariaLabel, ...rest }, ref) => {
    const isDecorative = !ariaLabel;
    const ariaProps = isDecorative
      ? { 'aria-hidden': true }
      : ({ 'aria-label': ariaLabel, role: 'img' } as const);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={cn('h-6 w-6 shrink-0', className)}
        focusable="false"
        {...ariaProps}
        {...rest}
      >
        {ariaLabel ? <title>{ariaLabel}</title> : null}
        <path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 01-.609-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
      </svg>
    );
  }
);

GooglePlayIcon.displayName = 'GooglePlayIcon';
