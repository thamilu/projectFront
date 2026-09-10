import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva('card text-card-foreground', {
  variants: {
    variant: {
      default: 'border-border bg-card',
      outlined: 'border-border bg-transparent',
      elevated: 'card-shadow-md border-transparent bg-card',
      filled: 'border-transparent bg-muted/50',
      ghost: 'card-ghost',
    },
    intent: {
      neutral: '',
      success: 'border-success/20 bg-success/10 text-success',
      warning: 'border-warning/20 bg-warning/10 text-warning',
      danger: 'border-destructive/20 bg-destructive/10 text-destructive',
      brand: 'border-primary/20 bg-primary/10 text-primary',
    },
    padding: {
      none: '[--card-padding-h:0px] [--card-padding-v:0px] [--card-section-gap:0px]',
      sm: '[--card-padding-h:1rem] [--card-padding-v:0.75rem] [--card-section-gap:0.75rem]',
      md: '[--card-padding-h:1.5rem] [--card-padding-v:1rem] [--card-section-gap:1rem]',
      lg: '[--card-padding-h:2rem] [--card-padding-v:1.5rem] [--card-section-gap:1.5rem]',
    },
    interactive: {
      true: 'card-hover cursor-pointer transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
      false: '',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    intent: 'neutral',
    padding: 'md',
    interactive: false,
    fullWidth: false,
  },
});

export type CardVariantProps = VariantProps<typeof cardVariants>;
