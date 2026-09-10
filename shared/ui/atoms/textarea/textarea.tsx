/**
 * @fileoverview Enterprise-grade Textarea component.
 *
 * Features:
 * - Full WCAG 2.1 AA accessibility compliance
 * - CVA-based variant system (default | ghost | outline)
 * - Size scale (sm | md | lg)
 * - Auto-resize capability
 * - Character count with threshold-based color coding
 * - Controlled & uncontrolled form integration
 * - Error, hint, loading, and read-only states
 * - Dark mode compatible via CSS custom properties
 * - Keyboard navigation compliant
 * - Screen reader tested
 *
 * @module @/shared/ui/textarea
 *
 * @example Basic
 * <Textarea placeholder="Enter description..." />
 *
 * @example Form-integrated with validation
 * <Textarea
 *   id="description"
 *   label="Project Description"
 *   isRequired
 *   error={errors.description?.message}
 *   hint="Describe your project in detail"
 *   showCharCount
 *   maxLength={500}
 *   autoResize
 * />
 *
 * @example Controlled
 * <Textarea
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   variant="outline"
 *   size="lg"
 * />
 */

'use client'; // Required for useEffect, useCallback, useRef

import * as React from 'react';
import { cn } from '@/shared/utils';

import { textareaVariants } from './textarea.constants';
import {
  getCharCountColorClass,
  getRemainingChars,
  buildAriaDescribedBy,
  buildSubElementId,
} from './textarea.utils';
import { useTextarea } from './useTextarea';
import type {
  TextareaProps,
  TextareaVariant,
  TextareaSize,
  TextareaResize,
  TextareaValidationState,
} from './textarea.types';

// ─────────────────────────────────────────────
// Sub-Component: Character Count Badge
// Isolated for reuse and independent testing
// ─────────────────────────────────────────────

interface CharCountBadgeProps {
  currentLength: number;
  maxLength: number;
  id?: string;
}

const CharCountBadge = React.memo<CharCountBadgeProps>(({ currentLength, maxLength, id }) => {
  const remaining = getRemainingChars(currentLength, maxLength);
  const colorClass = getCharCountColorClass(currentLength, maxLength);

  return (
    <span
      id={id}
      className={cn('ml-auto text-xs tabular-nums transition-colors duration-200', colorClass)}
      aria-live="polite"
      aria-atomic="true"
      // Screen reader: announces dynamically as user types
      aria-label={`${remaining} characters remaining`}
    >
      {currentLength}/{maxLength}
    </span>
  );
});
CharCountBadge.displayName = 'Textarea.CharCountBadge';

// ─────────────────────────────────────────────
// Sub-Component: Helper / Error Text
// Isolated for semantic correctness
// ─────────────────────────────────────────────

interface HelperTextProps {
  error?: string;
  hint?: string;
  errorId?: string;
  hintId?: string;
  helperClassName?: string;
}

const HelperText = React.memo<HelperTextProps>(
  ({ error, hint, errorId, hintId, helperClassName }) => {
    if (error) {
      return (
        <p
          id={errorId}
          className={cn('text-destructive flex items-center gap-1 text-xs', helperClassName)}
          role="alert" // Announces immediately to screen readers
          aria-live="assertive"
        >
          {/* Error Icon — pure CSS, no image dependency */}
          <span aria-hidden="true" className="font-bold">
            ⚠
          </span>
          {error}
        </p>
      );
    }

    if (hint) {
      return (
        <p id={hintId} className={cn('text-muted-foreground text-xs', helperClassName)}>
          {hint}
        </p>
      );
    }

    return null;
  }
);
HelperText.displayName = 'Textarea.HelperText';

// ─────────────────────────────────────────────
// Sub-Component: Label
// ─────────────────────────────────────────────

interface FieldLabelProps {
  label: string;
  htmlFor?: string;
  isRequired?: boolean;
  labelClassName?: string;
}

const FieldLabel = React.memo<FieldLabelProps>(({ label, htmlFor, isRequired, labelClassName }) => (
  <label
    htmlFor={htmlFor}
    className={cn('text-foreground block text-sm leading-none font-semibold', labelClassName)}
  >
    {label}
    {isRequired && (
      <span
        aria-hidden="true" // Decorative — isRequired on input handles semantics
        className="text-destructive ml-1"
      >
        *
      </span>
    )}
  </label>
));
FieldLabel.displayName = 'Textarea.FieldLabel';

// ─────────────────────────────────────────────
// Main Component: Textarea
// ─────────────────────────────────────────────

/**
 * Enterprise-grade Textarea with full accessibility, validation,
 * auto-resize, character counting, and design system integration.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      // ── Visual System ──────────────────────
      className,
      variant = 'default',
      size = 'md',
      resize = 'vertical',
      wrapperClassName,
      labelClassName,
      helperClassName,

      // ── Content & State ────────────────────
      value,
      defaultValue,
      onChange,

      // ── Validation ─────────────────────────
      error,
      hint,
      validationState,

      // ── Accessibility ──────────────────────
      id,
      label,
      describedBy,
      isRequired,
      disabled,
      readOnly,

      // ── Enhancement Features ───────────────
      autoResize = false,
      showCharCount = false,
      isLoading = false,
      isReadOnly,
      maxLength,

      // ── Rest ───────────────────────────────
      ...props
    },
    forwardedRef
  ) => {
    // ── Business Logic (Hook) ──────────────────
    const { textareaRef, charCount, handleChange } = useTextarea({
      autoResize,
      value,
      defaultValue,
      size,
      onChange,
    });

    // ── Ref Merging ────────────────────────────
    // Merge forwarded ref with internal ref (for auto-resize)
    const mergedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;

        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [forwardedRef, textareaRef]
    );

    // ── Derived State ──────────────────────────
    const isEffectivelyDisabled = disabled || isLoading;
    const isEffectivelyReadOnly = readOnly || isReadOnly;

    // Error state: explicit error string OR invalid validationState
    const hasError = Boolean(error) || validationState === 'invalid';

    // Resolve effective validationState from multiple signals
    const resolvedValidationState = validationState ?? (error ? 'invalid' : 'idle');

    // ── Sub-Element IDs (A11y) ─────────────────
    const hintId = buildSubElementId(id, 'hint');
    const errorId = buildSubElementId(id, 'error');
    const countId = buildSubElementId(id, 'count');

    // ── aria-describedby Construction ─────────
    // Assembles from: external describedBy + hint + error + charCount
    const ariaDescribedBy = buildAriaDescribedBy([
      describedBy,
      hint && !error ? hintId : undefined,
      error ? errorId : undefined,
      showCharCount && maxLength ? countId : undefined,
    ]);

    // ── Render ─────────────────────────────────
    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)} data-testid="textarea-wrapper">
        {/* ── Label Row ──────────────────────── */}
        {label && (
          <div className="flex items-center justify-between">
            <FieldLabel
              label={label}
              htmlFor={id}
              isRequired={isRequired}
              labelClassName={labelClassName}
            />

            {/* Character count in label row (Stripe/Linear pattern) */}
            {showCharCount && maxLength && (
              <CharCountBadge id={countId} currentLength={charCount} maxLength={maxLength} />
            )}
          </div>
        )}

        {/* ── Textarea Element ───────────────── */}
        <textarea
          ref={mergedRef}
          id={id}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          disabled={isEffectivelyDisabled}
          readOnly={isEffectivelyReadOnly}
          onChange={handleChange}
          className={cn(
            textareaVariants({
              variant,
              size,
              resize: autoResize ? 'auto' : resize,
              validationState: resolvedValidationState,
            }),
            // Loading: visual cursor treatment
            isLoading && 'cursor-wait',
            className
          )}
          // ── ARIA Attributes ──────────────────
          aria-required={isRequired}
          aria-invalid={hasError || undefined}
          aria-disabled={isEffectivelyDisabled || undefined}
          aria-readonly={isEffectivelyReadOnly || undefined}
          aria-describedby={ariaDescribedBy}
          aria-busy={isLoading || undefined}
          {...props}
        />

        {/* ── Bottom Row: Helper/Error + Count (no label) ─ */}
        {(!label && showCharCount && maxLength) || hint || error ? (
          <div className="flex items-start justify-between gap-2">
            {/* Helper or Error message */}
            <HelperText
              error={error}
              hint={hint}
              errorId={errorId}
              hintId={hintId}
              helperClassName={helperClassName}
            />

            {/* Char count when no label (moves to bottom row) */}
            {!label && showCharCount && maxLength && (
              <CharCountBadge id={countId} currentLength={charCount} maxLength={maxLength} />
            )}
          </div>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type {
  TextareaProps,
  TextareaVariant,
  TextareaSize,
  TextareaResize,
  TextareaValidationState,
};
