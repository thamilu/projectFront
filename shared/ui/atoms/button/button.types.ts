import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from './button-variants';

export interface ButtonSpinnerProps extends React.SVGAttributes<SVGElement> {
  /**
   * Controls animation speed.
   * Automatically disabled when prefers-reduced-motion is set.
   */
  speed?: 'slow' | 'normal' | 'fast';
  'data-testid'?: string;
}

export interface BaseButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    Omit<VariantProps<typeof buttonVariants>, 'size'> {
  /**
   * Render as a child element using Radix Slot (polymorphic rendering).
   * ⚠️ loading and disabled props are NOT forwarded in asChild mode.
   * Handle these states in your child component.
   */
  asChild?: boolean;

  /**
   * Displays spinner and prevents interaction.
   * Ignored silently (with dev warning) when asChild={true}.
   */
  loading?: boolean;

  /**
   * Custom aria-label for screen readers during loading.
   * Falls back to "{children} loading" for string children.
   */
  loadingText?: string;

  /**
   * Position of the loading spinner.
   * @default 'start'
   */
  loadingPosition?: 'start' | 'end' | 'replace';

  /**
   * Icon element to display to the left of the children.
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon element to display to the right of the children.
   */
  rightIcon?: React.ReactNode;

  /**
   * Locks button minimum width during loading to prevent layout shift.
   * Captures pre-loading width via ResizeObserver.
   */
  preserveWidthOnLoading?: boolean;

  /**
   * When true, button remains keyboard-focusable when disabled.
   * Use with tooltip to explain why the action is unavailable.
   * @default false
   */
  keepFocusableWhenDisabled?: boolean;

  /** Spinner animation speed. @default 'normal' */
  spinnerSpeed?: ButtonSpinnerProps['speed'];

  /** Standard HTML button type. @default 'button' */
  type?: 'button' | 'submit' | 'reset';

  /** QA automation selector. Prefer role-based queries in tests. */
  'data-testid'?: string;

  /**
   * Delay (in ms) before showing the loading spinner.
   * Prevents visual flicker on fast requests.
   * @default 0
   */
  loadingDelay?: number;
}

/**
 * Icon button — size="icon" REQUIRES aria-label (WCAG 4.1.2).
 *
 * @example
 * <Button size="icon" aria-label="Close dialog">
 *   <XIcon />
 * </Button>
 */
export interface IconButtonProps extends BaseButtonProps {
  size: 'icon';
  'aria-label': string;
}

/**
 * Standard button with visible text label.
 *
 * @example
 * <Button variant="default" size="lg" loading>
 *   Save Changes
 * </Button>
 */
export interface StandardButtonProps extends BaseButtonProps {
  size?: Exclude<VariantProps<typeof buttonVariants>['size'], 'icon'>;
  'aria-label'?: string;
}

/**
 * Discriminated union: enforces aria-label on icon-only buttons.
 * Pair with runtime warnOnce() for dynamic size values.
 */
export type ButtonProps = IconButtonProps | StandardButtonProps;

export interface ButtonGroupContextValue {
  size?: ButtonProps['size'];
  variant?: Exclude<ButtonProps['variant'], 'link' | 'ghost'>;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  type?: 'button' | 'submit' | 'reset';
  spinnerSpeed?: 'slow' | 'normal' | 'fast';
  loadingPosition?: 'start' | 'end' | 'replace';
  preserveWidthOnLoading?: boolean;
}

export interface ButtonGroupProps {
  children: React.ReactNode;
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Shared size for all child buttons.
   * Individual buttons can override via their own size prop.
   */
  size?: ButtonGroupContextValue['size'];
  /**
   * Shared variant. 'link' and 'ghost' are excluded as they
   * lack borders/backgrounds needed for visual grouping.
   */
  variant?: ButtonGroupContextValue['variant'];
  /** Disables all buttons in the group */
  disabled?: boolean;
  /** Makes all buttons fill equal width */
  fullWidth?: boolean;
  className?: string;
  /** Required for accessibility when group purpose isn't clear from context */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'data-testid'?: string;
  type?: 'button' | 'submit' | 'reset';
  spinnerSpeed?: 'slow' | 'normal' | 'fast';
  loadingPosition?: 'start' | 'end' | 'replace';
  preserveWidthOnLoading?: boolean;
}
