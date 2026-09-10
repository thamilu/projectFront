'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/shared/utils';
import { cardVariants } from './card.variants';
import { CardContext, useCardContext } from './card.context';
import type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  CardMediaProps,
  CardSkeletonProps,
} from './card.types';

// ============================================================
// HELPERS
// ============================================================

/**
 * Detects a nested <CardTitle> (directly, or one level inside a wrapper
 * like <CardHeader>) so Card only wires aria-labelledby when there's an
 * actual heading for it to point to.
 *
 * Without this, Card generated a useId()-based aria-labelledby on every
 * instance regardless of whether a CardTitle existed to receive that id —
 * a dangling reference on every title-less card (the common case: cards
 * that only use CardContent), and since that unused id had no rendered
 * consumer, its value being unstable across a Suspense/dynamic-import
 * boundary surfaced as a hydration mismatch with nothing visibly wrong to
 * a reader of the JSX. Referencing CardTitle here (declared further down
 * in this module) is safe: this function only runs during Card's render,
 * by which time the whole module has already been evaluated once.
 */
function containsCardTitle(node: React.ReactNode, depth = 0): boolean {
  if (depth > 3) return false;
  let found = false;
  React.Children.forEach(node, (child) => {
    if (found || !React.isValidElement(child)) return;
    if (child.type === CardTitle) {
      found = true;
      return;
    }
    const childChildren = (child.props as { children?: React.ReactNode } | null)?.children;
    if (childChildren) {
      found = containsCardTitle(childChildren, depth + 1);
    }
  });
  return found;
}

// ============================================================
// CARD ROOT COMPONENT
// ============================================================
const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      className,
      asChild = false,
      isLoading = false,
      variant = 'default',
      intent = 'neutral',
      padding = 'md',
      interactive = false,
      fullWidth = false,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    const titleId = React.useId();
    const { onKeyDown, tabIndex, ...restProps } = props;

    const contextValue = React.useMemo(
      () => ({
        variant: variant || 'default',
        intent: intent || 'neutral',
        padding: padding || 'md',
        interactive: !!interactive,
        isLoading: !!isLoading,
        titleId,
      }),
      [variant, intent, padding, interactive, isLoading, titleId]
    );

    const computedClassName = React.useMemo(() => {
      return cn(
        cardVariants({
          variant,
          intent,
          padding,
          interactive,
          fullWidth,
        }),
        className
      );
    }, [variant, intent, padding, interactive, fullWidth, className]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.currentTarget.click();
        }
        onKeyDown?.(e);
      },
      [interactive, onKeyDown]
    );

    if (isLoading) {
      return (
        <CardSkeleton
          ref={ref as React.ForwardedRef<HTMLDivElement>}
          className={computedClassName}
          data-testid={dataTestId}
          {...(restProps as CardSkeletonProps)}
        />
      );
    }

    const Comp = asChild ? Slot : 'div';
    const hasTitle = containsCardTitle(restProps.children);

    return (
      <CardContext.Provider value={contextValue}>
        {/* @ts-ignore Slot and Div components have matching compatible element ref profiles */}
        <Comp
          ref={ref as React.Ref<HTMLDivElement>}
          className={computedClassName}
          data-slot="card"
          data-variant={variant || 'default'}
          data-intent={intent || 'neutral'}
          data-interactive={interactive ? 'true' : undefined}
          data-loading={isLoading ? 'true' : undefined}
          data-analytics-component="card"
          data-testid={dataTestId}
          tabIndex={interactive ? (tabIndex ?? 0) : tabIndex}
          aria-labelledby={props['aria-label'] || !hasTitle ? undefined : titleId}
          aria-busy={isLoading || undefined}
          onKeyDown={handleKeyDown}
          {...restProps}
        />
      </CardContext.Provider>
    );
  }
);
Card.displayName = 'Card';

// ============================================================
// CARD HEADER
// ============================================================
const CardHeader = React.memo(
  React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => {
    useCardContext('CardHeader');

    return (
      <div ref={ref} data-slot="card-header" className={cn('card-header', className)} {...props} />
    );
  })
);
CardHeader.displayName = 'CardHeader';

// ============================================================
// CARD TITLE
// ============================================================
const CardTitle = React.memo(
  React.forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, as = 'h3', truncate = false, ...props }, ref) => {
      const { titleId } = useCardContext('CardTitle');
      const Heading = as as React.ElementType;

      return (
        <Heading
          ref={ref}
          id={titleId}
          data-slot="card-title"
          className={cn('card-title', truncate && 'max-w-full truncate', className)}
          {...props}
        />
      );
    }
  )
);
CardTitle.displayName = 'CardTitle';

// ============================================================
// CARD DESCRIPTION
// ============================================================
const CardDescription = React.memo(
  React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, ...props }, ref) => {
    useCardContext('CardDescription');

    return (
      <p
        ref={ref}
        data-slot="card-description"
        className={cn('card-description', className)}
        {...props}
      />
    );
  })
);
CardDescription.displayName = 'CardDescription';

// ============================================================
// CARD CONTENT
// ============================================================
/**
 * CSS class 'card-body' maps to design-system anatomy token.
 * Component is named CardContent per React API convention.
 * Mapping documented in design-system/naming-contract.md
 */
const CardContent = React.memo(
  React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
    useCardContext('CardContent');

    return (
      <div ref={ref} data-slot="card-content" className={cn('card-body', className)} {...props} />
    );
  })
);
CardContent.displayName = 'CardContent';

// ============================================================
// CARD FOOTER
// ============================================================
const CardFooter = React.memo(
  React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => {
    useCardContext('CardFooter');

    return (
      <div ref={ref} data-slot="card-footer" className={cn('card-footer', className)} {...props} />
    );
  })
);
CardFooter.displayName = 'CardFooter';

// ============================================================
// CARD MEDIA
// ============================================================
const CardMedia = React.memo(
  React.forwardRef<HTMLDivElement, CardMediaProps>(({ className, aspectRatio, ...props }, ref) => {
    useCardContext('CardMedia');

    const aspectClass = aspectRatio ? `card-media-${aspectRatio.replace('/', '-')}` : '';

    return (
      <div
        ref={ref}
        data-slot="card-media"
        className={cn('card-media relative overflow-hidden', aspectClass, className)}
        {...props}
      />
    );
  })
);
CardMedia.displayName = 'CardMedia';

// ============================================================
// CARD SKELETON
// ============================================================
const CardSkeleton = React.memo(
  React.forwardRef<HTMLDivElement, CardSkeletonProps>(
    (
      { className, lines = 3, showAvatar = false, showFooter = false, showMedia = false, ...props },
      ref
    ) => {
      return (
        <div
          ref={ref}
          role="status"
          aria-label="Loading card content"
          aria-busy="true"
          aria-live="polite"
          data-slot="card-skeleton"
          className={cn('card flex animate-pulse flex-col gap-4 p-6', className)}
          {...props}
        >
          {showMedia && (
            <div aria-hidden="true" className="bg-muted aspect-video w-full rounded-t-[inherit]" />
          )}

          {(showAvatar || lines > 0) && (
            <div aria-hidden="true" className="flex items-start gap-4">
              {showAvatar && <div className="bg-muted h-10 w-10 shrink-0 rounded-full" />}
              {lines > 0 && (
                <div className="flex flex-1 flex-col gap-2">
                  {Array.from({ length: lines }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-muted h-4 rounded"
                      style={{
                        width: `${Math.max(40, 100 - i * 12)}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {showFooter && (
            <div aria-hidden="true" className="mt-2 flex gap-2">
              <div className="bg-muted h-8 w-20 rounded" />
              <div className="bg-muted h-8 w-20 rounded" />
            </div>
          )}

          <span className="sr-only">Loading, please wait…</span>
        </div>
      );
    }
  )
);
CardSkeleton.displayName = 'CardSkeleton';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMedia,
  CardSkeleton,
};
