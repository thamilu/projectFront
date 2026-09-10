import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Button Variants
 * Define CVA transitions with motion-safe classes to respect prefers-reduced-motion.
 */
export const buttonVariants = cva(
  [
    // Layout
    'inline-flex max-w-full items-center justify-center',
    // Typography
    'text-sm font-medium leading-none whitespace-nowrap',
    // Shape
    'rounded-md',
    // Interaction
    'touch-manipulation cursor-pointer select-none',
    // Smooth transition — respects prefers-reduced-motion
    'motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none',
    // Focus ring infrastructure
    'ring-offset-background',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-ring focus-visible:ring-offset-2',
    // Disabled state
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    // Active press micro-interaction — respects reduced-motion
    'motion-safe:active:scale-[0.97] motion-safe:active:brightness-[0.96]',
    // SVG children baseline
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:flex-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm ' + 'hover:bg-primary/90 hover:shadow-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm ' +
          'hover:bg-destructive/90 hover:shadow-md',
        outline:
          'border border-input bg-background shadow-sm ' +
          'hover:bg-accent hover:text-accent-foreground hover:border-accent',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm ' + 'hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline ' + 'h-auto p-0', // reset height/padding for link variant
      },
      size: {
        default: 'h-10 px-4 gap-2 [&_svg]:size-4',
        sm: 'h-9 px-3 gap-1.5 text-xs [&_svg]:size-3.5',
        lg: 'h-11 px-6 gap-2 text-[0.9375rem] [&_svg]:size-[1.125rem]',
        xl: 'h-12 px-8 gap-2.5 text-base [&_svg]:size-5',
        icon: 'h-10 w-10 gap-0 p-0 [&_svg]:size-[1.125rem]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        size: 'xl',
        className: 'font-semibold',
      },
      {
        variant: 'destructive',
        size: 'xl',
        className: 'font-semibold',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

export type { VariantProps };
