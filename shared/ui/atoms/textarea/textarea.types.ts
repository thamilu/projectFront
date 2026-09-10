/**
 * @fileoverview Type definitions for the enterprise-grade Textarea component.
 * Follows strict TypeScript standards with full prop documentation.
 */

import * as React from 'react';

// ─────────────────────────────────────────────
// Variant & Size Enums (Design System Tokens)
// ─────────────────────────────────────────────

/**
 * Visual variants following the design system specification.
 * Maps to semantic UI states and style treatments.
 */
export type TextareaVariant = 'default' | 'ghost' | 'outline';

/**
 * Size scale following the 8pt grid design system.
 * sm = compact forms, md = standard, lg = featured inputs
 */
export type TextareaSize = 'sm' | 'md' | 'lg';

/**
 * Resize behavior control.
 * Maps directly to CSS resize property with UX-safe defaults.
 */
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';

/**
 * Validation state for form integration.
 * Drives visual feedback and ARIA attribute injection.
 */
export type TextareaValidationState = 'idle' | 'valid' | 'invalid' | 'loading';

// ─────────────────────────────────────────────
// Core Props Interface
// ─────────────────────────────────────────────

/**
 * TextareaProps — Enterprise-grade textarea component props.
 *
 * @extends React.TextareaHTMLAttributes<HTMLTextAreaElement>
 *
 * @example
 * <Textarea
 *   variant="default"
 *   size="md"
 *   label="Description"
 *   error="This field is required"
 *   showCharCount
 *   autoResize
 * />
 */
export interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size'
> {
  // ── Visual System ──────────────────────────

  /** Visual style variant. @default 'default' */
  variant?: TextareaVariant;

  /** Size scale following design system tokens. @default 'md' */
  size?: TextareaSize;

  /** Controls resize handle behavior. @default 'vertical' */
  resize?: TextareaResize;

  // ── Validation & State ─────────────────────

  /** Drives visual + ARIA error state. Mutually exclusive with hint. */
  error?: string;

  /** Helper text shown below input in idle state. */
  hint?: string;

  /** Validation state for controlled form integration. @default 'idle' */
  validationState?: TextareaValidationState;

  // ── Labeling & Accessibility ───────────────

  /** Accessible label. Required if no external <label> references this input. */
  label?: string;

  /** ID of external element that describes this textarea. */
  describedBy?: string;

  /** Whether field is required in the form. */
  isRequired?: boolean;

  // ── Enhancement Features ───────────────────

  /** Enables automatic height growth as user types. @default false */
  autoResize?: boolean;

  /** Displays character count badge. Requires maxLength prop. @default false */
  showCharCount?: boolean;

  /** Loading state — disables input and shows loading indicator. @default false */
  isLoading?: boolean;

  /** Visually marks field as read-only with distinct styling. */
  isReadOnly?: boolean;

  // ── Layout ────────────────────────────────

  /** Additional className for the wrapper container. */
  wrapperClassName?: string;

  /** Additional className for the label element. */
  labelClassName?: string;

  /** Additional className for the helper/error text. */
  helperClassName?: string;
}
