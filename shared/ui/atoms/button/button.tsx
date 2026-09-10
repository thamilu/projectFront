/**
 * @file button.tsx
 * @description Enterprise-grade Button component system.
 *
 * Architecture:
 * - CVA for compile-time variant safety
 * - Radix Slot for polymorphic rendering
 * - ButtonGroup context for coordinated button sets
 * - Full WCAG 2.2 AA compliance (SC 4.1.2, 4.1.3, 1.3.1)
 * - prefers-reduced-motion runtime + CSS support
 * - Always-mounted aria-live region for reliable SR announcements
 * - Stable ref merge via useMergedRef hook
 * - Race-condition-safe loading delay
 *
 * @module @/shared/ui/button
 * @version 3.2.0
 */

'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/shared/utils';
import { useMergedRef } from '@/shared/hooks/use-merged-ref';
import { warnOnce } from '../../utils/warn-once';
import { buttonVariants } from './button-variants';
import { ButtonSpinner } from './button-spinner';
import { ButtonGroup, useButtonGroup } from './button-group';
import type { ButtonProps, ButtonSpinnerProps, ButtonGroupProps } from './button.types';

// ─────────────────────────────────────────────────────────────────────────────
// PURE UTILITIES (module-level, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the accessible label for the button during loading state.
 * Pure function — safe to call outside React lifecycle.
 */
function resolveLoadingAriaLabel(
  loadingText: string | undefined,
  children: React.ReactNode,
  ariaLabel: string | undefined
): string {
  if (loadingText) return loadingText;
  if (typeof children === 'string') return `${children}, loading`;
  if (ariaLabel) return `${ariaLabel}, loading`;
  return 'Loading';
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      // Styling
      className,
      variant: variantProp,
      size: sizeProp,
      fullWidth,

      // Icons
      leftIcon,
      rightIcon,

      // Behavior
      asChild = false,
      loading = false,
      loadingText,
      loadingPosition = 'start',
      preserveWidthOnLoading = false,
      keepFocusableWhenDisabled = false,
      spinnerSpeed = 'normal',
      loadingDelay = 0,

      // HTML
      disabled,
      type = 'button',
      children,

      // Aria / Testing
      'data-testid': testId,
      'aria-label': ariaLabel,

      // Rest
      ...props
    },
    forwardedRef
  ) => {
    // Destructure properties to avoid double registration or props spreading side-effects
    const { onClick, style, 'aria-describedby': ariaDescribedBy, ...restProps } = props;

    // ─── Group Context ─────────────────────────────────────────────
    const group = useButtonGroup();
    const variant = variantProp ?? group.variant;
    const size = sizeProp ?? group.size;
    const type_ = type ?? group.type ?? 'button';
    const spinnerSpeed_ = spinnerSpeed ?? group.spinnerSpeed ?? 'normal';
    const loadingPosition_ = loadingPosition ?? group.loadingPosition ?? 'start';
    const preserveWidth_ = preserveWidthOnLoading ?? group.preserveWidthOnLoading ?? false;
    const isGroupDisabled = group.disabled ?? false;

    // ─── Derived State ─────────────────────────────────────────────
    const isDisabled = disabled || isGroupDisabled;
    const isInteractionDisabled = isDisabled || loading;

    // ─── prefers-reduced-motion ────────────────────────────────────
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    // ─── Loading Delay (race-condition safe) ───────────────────────
    const [delayedLoading, setDelayedLoading] = React.useState(false);

    React.useEffect(() => {
      if (!loading) {
        setDelayedLoading(false);
        return;
      }

      // Skip delay for reduced-motion users
      const effectiveDelay = prefersReducedMotion ? 0 : loadingDelay;

      if (!effectiveDelay) {
        setDelayedLoading(true);
        return;
      }

      let cancelled = false;

      const timer = setTimeout(() => {
        if (!cancelled) setDelayedLoading(true);
      }, effectiveDelay);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [loading, loadingDelay, prefersReducedMotion]);

    // ─── Width Preservation ────────────────────────────────────────
    const internalRef = React.useRef<HTMLButtonElement>(null);
    const [savedWidth, setSavedWidth] = React.useState<number | undefined>();

    React.useEffect(() => {
      if (!preserveWidth_ || loading) return;

      const element = internalRef.current;
      if (!element) return;

      // Read initial size imperatively
      const initialWidth = element.getBoundingClientRect().width;
      if (initialWidth > 0) setSavedWidth(initialWidth);

      if (typeof ResizeObserver === 'undefined') return;

      let frameId: number;

      const observer = new ResizeObserver((entries) => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          for (const entry of entries) {
            const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
            if (width > 0) setSavedWidth(width);
          }
        });
      });

      observer.observe(element);

      return () => {
        cancelAnimationFrame(frameId);
        observer.disconnect();
      };
    }, [loading, preserveWidth_]);

    // ─── Stable Ref Merge ──────────────────────────────────────────
    const ref = useMergedRef(forwardedRef, internalRef);

    // ─── Development Warnings (tree-shaken in production) ──────────
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useEffect(() => {
        if (size === 'icon' && !ariaLabel) {
          warnOnce(
            'icon-no-aria-label',
            'error',
            'Icon buttons (size="icon") require `aria-label`.\n' +
              'WCAG 2.1 SC 4.1.2\n' +
              'Fix: <Button size="icon" aria-label="Close dialog"><XIcon /></Button>'
          );
        }
        if (asChild && loading) {
          warnOnce(
            'asChild-loading',
            'warn',
            '`loading` is ignored when `asChild={true}`. ' +
              'Manage loading state in your child component.'
          );
        }
        if (asChild && disabled) {
          warnOnce(
            'asChild-disabled',
            'warn',
            '`disabled` behavior differs with `asChild={true}`. ' +
              'Ensure your child handles disabled state.'
          );
        }
        if (keepFocusableWhenDisabled && isDisabled && !ariaDescribedBy) {
          warnOnce(
            'disabled-no-describedby',
            'warn',
            'Focusable disabled buttons should have `aria-describedby` ' +
              'explaining why the action is unavailable.\n' +
              'WCAG 1.3.1 / 3.3.2 / 4.1.2'
          );
        }
      }, [
        size,
        ariaLabel,
        asChild,
        loading,
        disabled,
        keepFocusableWhenDisabled,
        isDisabled,
        ariaDescribedBy,
      ]);
    }

    // ─── Computed Values ───────────────────────────────────────────

    // Stable className — only recomputes when visual props change
    const computedClassName = React.useMemo(
      () => cn(buttonVariants({ variant, size, fullWidth, className })),
      [variant, size, fullWidth, className]
    );

    // Accessible label — stable deps (no children for non-string path)
    const resolvedAriaLabel = React.useMemo(() => {
      if (!delayedLoading) return ariaLabel;
      return resolveLoadingAriaLabel(loadingText, children, ariaLabel);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [delayedLoading, loadingText, ariaLabel]);

    // Stable onClick ref — prevents handleClick recreation on every render
    const onClickRef = React.useRef(onClick);
    React.useLayoutEffect(() => {
      onClickRef.current = onClick;
    });

    // ─── Event Handlers ────────────────────────────────────────────
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractionDisabled && keepFocusableWhenDisabled) {
          e.preventDefault();
          return;
        }
        onClickRef.current?.(e);
      },
      [isInteractionDisabled, keepFocusableWhenDisabled]
    );

    const handleAsChildClick = React.useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        if (isInteractionDisabled) {
          if (keepFocusableWhenDisabled) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
        onClickRef.current?.(e as React.MouseEvent<HTMLButtonElement>);
      },
      [isInteractionDisabled, keepFocusableWhenDisabled]
    );

    // ─── asChild Branch ────────────────────────────────────────────
    if (asChild) {
      return (
        <Slot
          data-slot="button"
          data-testid={testId}
          data-variant={variant}
          data-size={size}
          ref={ref as React.Ref<HTMLButtonElement>}
          aria-label={resolvedAriaLabel || undefined}
          aria-disabled={isDisabled || undefined}
          data-disabled={isDisabled || undefined}
          className={computedClassName}
          onClick={handleAsChildClick}
          {...restProps}
        >
          {children}
        </Slot>
      );
    }

    // ─── Standard Button Branch ────────────────────────────────────
    const nativeDisabled = isInteractionDisabled && !keepFocusableWhenDisabled;
    const ariaDisabledValue = isInteractionDisabled ? true : undefined;

    const showLeftIcon = !delayedLoading && leftIcon;
    const showRightIcon = !delayedLoading && rightIcon;

    const spinnerAtStart = delayedLoading && loadingPosition_ === 'start';
    const spinnerAtEnd = delayedLoading && loadingPosition_ === 'end';
    const replaceContent = delayedLoading && loadingPosition_ === 'replace';

    // Derive loading announcement text (for always-mounted region)
    const loadingAnnouncement = delayedLoading
      ? loadingText ||
        (loadingPosition_ === 'replace'
          ? 'Loading'
          : typeof children === 'string'
            ? `${children}, loading`
            : 'Loading')
      : ''; // Empty string = no announcement when not loading

    const spinnerTestId = testId ? `${testId}-spinner` : undefined;
    const contentTestId = testId ? `${testId}-content` : undefined;
    const leftIconTestId = testId ? `${testId}-left-icon` : undefined;
    const rightIconTestId = testId ? `${testId}-right-icon` : undefined;

    return (
      <button
        data-slot="button"
        data-testid={testId}
        data-variant={variant}
        data-size={size}
        data-analytics-component="button"
        ref={ref}
        type={type_}
        disabled={nativeDisabled}
        aria-label={resolvedAriaLabel || undefined}
        aria-disabled={ariaDisabledValue}
        aria-busy={delayedLoading || undefined}
        aria-describedby={ariaDescribedBy}
        data-loading={delayedLoading || undefined}
        data-disabled={isInteractionDisabled || undefined}
        className={computedClassName}
        style={{
          // Apply fixed width only during loading state
          width: preserveWidth_ && savedWidth && delayedLoading ? `${savedWidth}px` : undefined,
          ...style,
        }}
        onClick={handleClick}
        {...restProps}
      >
        {/*
         * Always-mounted live region — MUST exist before content changes
         * for reliable screen reader announcements (JAWS/NVDA/VoiceOver).
         * Empty string when idle = silent. Non-empty = announcement fires.
         * WCAG 2.2 SC 4.1.3 (Status Messages)
         */}
        <span
          className="sr-only"
          aria-live={delayedLoading ? 'polite' : undefined}
          aria-atomic={delayedLoading ? 'true' : undefined}
          role={delayedLoading ? 'status' : undefined}
        >
          {loadingAnnouncement}
        </span>

        {/* Loading spinner — start position */}
        {spinnerAtStart && (
          <span aria-hidden="true">
            <ButtonSpinner speed={spinnerSpeed_} data-testid={spinnerTestId} />
          </span>
        )}

        {/* Left icon — decorative */}
        {showLeftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true" data-testid={leftIconTestId}>
            {leftIcon}
          </span>
        )}

        {/* Button content */}
        {replaceContent ? (
          /* Replace mode — spinner takes full content area */
          <span aria-hidden="true">
            <ButtonSpinner speed={spinnerSpeed_} data-testid={spinnerTestId} />
          </span>
        ) : (
          <span
            data-slot="button-content"
            data-testid={contentTestId}
            className={cn('inline-flex min-w-0 items-center', delayedLoading && 'opacity-80')}
          >
            {delayedLoading && loadingText ? (
              <span className="truncate" aria-hidden={!!resolvedAriaLabel || undefined}>
                {loadingText}
              </span>
            ) : typeof children === 'string' ? (
              <span className="truncate">{children}</span>
            ) : (
              children
            )}
          </span>
        )}

        {/* Right icon — decorative */}
        {showRightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true" data-testid={rightIconTestId}>
            {rightIcon}
          </span>
        )}

        {/* Loading spinner — end position */}
        {spinnerAtEnd && (
          <span aria-hidden="true">
            <ButtonSpinner speed={spinnerSpeed_} data-testid={spinnerTestId} />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, ButtonGroup, ButtonSpinner, buttonVariants, useButtonGroup };
export type { ButtonSpinnerProps, ButtonProps, ButtonGroupProps };
