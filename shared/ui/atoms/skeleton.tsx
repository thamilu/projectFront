/**
 * @fileoverview Enterprise Skeleton Loading System
 * @module shared/ui/atoms/skeleton
 * @version 2.0.0
 */

import { memo, type HTMLAttributes, type CSSProperties } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils';

// ── CVA Definition ────────────────────────────────────────────────────────

const skeletonVariants = cva(['motion-safe:animate-pulse', 'motion-reduce:opacity-50'], {
  variants: {
    variant: {
      default: 'bg-muted',
      primary: 'bg-primary/10',
      secondary: 'bg-secondary/10',
    },
    size: {
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-6',
      xl: 'h-8',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    rounded: 'md',
  },
});

// ── Type Derivations ──────────────────────────────────────────────────────

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>;

export type SkeletonSize = NonNullable<SkeletonVariantProps['size']>;
export type SkeletonRounded = NonNullable<SkeletonVariantProps['rounded']>;
export type SkeletonVariant = NonNullable<SkeletonVariantProps['variant']>;

// ── Utilities ─────────────────────────────────────────────────────────────

function toCSSValue(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

// ── Type Definitions ──────────────────────────────────────────────────────

type SkeletonDimensionProps =
  | { size?: SkeletonSize; height?: never }
  | { size?: never; height: number | string };

export type SkeletonProps = HTMLAttributes<HTMLDivElement> &
  Omit<SkeletonVariantProps, 'size'> &
  SkeletonDimensionProps & {
    width?: number | string;
  };

// ── Skeleton Primitive ────────────────────────────────────────────────────

export const Skeleton = memo(function Skeleton({
  className,
  variant,
  size,
  rounded,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const combinedStyle: CSSProperties = {
    ...style,
    ...(width != null && { width: toCSSValue(width) }),
    ...(height != null && { height: toCSSValue(height) }),
  };

  const resolvedSize = height != null ? null : size;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(skeletonVariants({ variant, size: resolvedSize, rounded }), className)}
      style={combinedStyle}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// ── SkeletonText ──────────────────────────────────────────────────────────

const TEXT_GAP_CLASS = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
} as const;

type TextGap = keyof typeof TEXT_GAP_CLASS;

export interface SkeletonTextProps {
  lines?: number;
  truncateLastLine?: boolean;
  size?: SkeletonSize;
  variant?: SkeletonVariant;
  gap?: TextGap;
  className?: string;
}

export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  truncateLastLine = true,
  size = 'md',
  variant = 'default',
  gap = 'md',
  className,
}: SkeletonTextProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('flex flex-col', TEXT_GAP_CLASS[gap], className)}
    >
      {Array.from({ length: lines }, (_, index) => {
        const isLastLine = index === lines - 1;
        return (
          <Skeleton
            key={index}
            size={size}
            variant={variant}
            className={cn('w-full', isLastLine && truncateLastLine && 'w-3/5')}
          />
        );
      })}
    </div>
  );
});

SkeletonText.displayName = 'SkeletonText';

// ── SkeletonAvatar ────────────────────────────────────────────────────────

const AVATAR_DIMENSION_CLASS = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
} as const;

type AvatarSize = keyof typeof AVATAR_DIMENSION_CLASS;

export interface SkeletonAvatarProps {
  size?: AvatarSize;
  variant?: SkeletonVariant;
  className?: string;
}

export const SkeletonAvatar = memo(function SkeletonAvatar({
  size = 'md',
  variant = 'default',
  className,
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      rounded="full"
      variant={variant}
      className={cn(AVATAR_DIMENSION_CLASS[size], className)}
    />
  );
});

SkeletonAvatar.displayName = 'SkeletonAvatar';

// ── SkeletonCard ──────────────────────────────────────────────────────────

export interface SkeletonCardProps {
  showImage?: boolean;
  showAvatar?: boolean;
  bodyLines?: number;
  variant?: SkeletonVariant;
  className?: string;
}

export const SkeletonCard = memo(function SkeletonCard({
  showImage = true,
  showAvatar = true,
  bodyLines = 2,
  variant = 'default',
  className,
}: SkeletonCardProps) {
  return (
    <div role="presentation" aria-hidden="true" className={cn('flex flex-col gap-3', className)}>
      {showImage && <Skeleton rounded="md" variant={variant} className="h-40 w-full" />}
      <Skeleton size="lg" variant={variant} className="w-3/4" />
      <SkeletonText lines={bodyLines} size="md" variant={variant} gap="sm" />
      {showAvatar && (
        <div className="flex items-center gap-2">
          <SkeletonAvatar size="sm" variant={variant} />
          <Skeleton size="sm" variant={variant} className="w-24" />
        </div>
      )}
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

// ── LoadingRegion ─────────────────────────────────────────────────────────

export interface LoadingRegionProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: React.ReactNode;
}

export const LoadingRegion = memo(function LoadingRegion({
  label,
  children,
  className,
  ...props
}: LoadingRegionProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      aria-live="polite"
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  );
});

LoadingRegion.displayName = 'LoadingRegion';
