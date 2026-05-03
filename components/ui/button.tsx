import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors active:scale-[0.98] active:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 [&_svg]:size-4',
        sm: 'h-10 px-3 text-xs [&_svg]:size-3.5',
        lg: 'h-12 px-8 [&_svg]:size-5',
        xl: 'h-14 px-10 text-lg [&_svg]:size-6',
        icon: 'h-11 w-11 [&_svg]:size-5',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Loading spinner component for button loading state
 */
const ButtonSpinner = () => (
  <svg
    className="animate-spin"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Base button props without size discrimination
 */
interface BaseButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    Omit<VariantProps<typeof buttonVariants>, 'size'> {
  asChild?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Props for icon-only buttons (requires aria-label for accessibility)
 */
interface IconButtonProps extends BaseButtonProps {
  size: 'icon';
  'aria-label': string;
}

/**
 * Props for standard buttons with optional size
 */
interface StandardButtonProps extends BaseButtonProps {
  size?: Exclude<VariantProps<typeof buttonVariants>['size'], 'icon'>;
  'aria-label'?: string;
}

/**
 * Discriminated union ensures icon buttons have aria-label
 */
export type ButtonProps = IconButtonProps | StandardButtonProps;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // When asChild is true, we can't inject the spinner because Slot expects
    // exactly one React element child. Parent component should handle loading state.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        type={type}
        {...props}
      >
        {loading && <ButtonSpinner />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
