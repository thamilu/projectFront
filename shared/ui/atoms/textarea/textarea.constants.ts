/**
 * @fileoverview Design system constants for Textarea component.
 * All visual tokens are centralized here — single source of truth.
 *
 * Architecture Decision: Using cva() (class-variance-authority) for
 * variant management follows the CVA pattern used by shadcn/ui,
 * Radix UI, and enterprise design systems at scale.
 */

import { cva } from 'class-variance-authority';

// ─────────────────────────────────────────────
// Base Styles — Applied to ALL variants
// Organized by: Layout → Visual → State → A11y
// ─────────────────────────────────────────────

export const TEXTAREA_BASE_STYLES = [
  // Layout
  'w-full',
  'flex',

  // Visual Foundation
  'rounded-md',
  'border',
  'bg-background',
  'text-foreground',

  // Typography
  'text-sm',
  'leading-relaxed',
  'font-normal',

  // Placeholder
  'placeholder:text-muted-foreground',
  'placeholder:text-sm',

  // Transitions (Performance: specific properties only)
  'transition-colors',
  'duration-200',
  'ease-in-out',

  // Focus Ring (A11y: always visible focus)
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ring',
  'focus-visible:ring-offset-2',
  'ring-offset-background',

  // Disabled State
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
  'disabled:bg-muted',
  'disabled:resize-none',

  // Read-only State
  'read-only:cursor-default',
  'read-only:bg-muted/50',
  'read-only:border-dashed',
] as const;

// ─────────────────────────────────────────────
// CVA Variant Configuration
// ─────────────────────────────────────────────

export const textareaVariants = cva(TEXTAREA_BASE_STYLES.join(' '), {
  variants: {
    // ── Visual Variant ──────────────────────
    variant: {
      default: ['border-input', 'hover:border-ring/50', 'focus-visible:border-ring'].join(' '),

      ghost: [
        'border-transparent',
        'bg-transparent',
        'hover:bg-accent/10',
        'focus-visible:bg-background',
        'focus-visible:border-input',
      ].join(' '),

      outline: [
        'border-2',
        'border-input',
        'bg-transparent',
        'hover:border-ring/70',
        'focus-visible:border-ring',
      ].join(' '),
    },

    // ── Size Scale ──────────────────────────
    size: {
      sm: 'min-h-[60px] px-2.5 py-1.5 text-xs',
      md: 'min-h-[80px] px-3 py-2 text-sm',
      lg: 'min-h-[120px] px-4 py-3 text-base',
    },

    // ── Validation State ────────────────────
    validationState: {
      idle: '',
      valid: 'border-success focus-visible:ring-success',
      invalid: 'border-destructive focus-visible:ring-destructive',
      loading: 'opacity-70 cursor-wait',
    },

    // ── Resize Behavior ─────────────────────
    resize: {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
      auto: 'resize-none overflow-hidden', // Handled via JS
    },
  },

  // ── Default Variants ────────────────────────
  defaultVariants: {
    variant: 'default',
    size: 'md',
    validationState: 'idle',
    resize: 'vertical',
  },
});

// ─────────────────────────────────────────────
// Minimum Rows per Size (Auto-Resize)
// ─────────────────────────────────────────────

export const TEXTAREA_MIN_ROWS: Record<string, number> = {
  sm: 2,
  md: 3,
  lg: 4,
} as const;

// ─────────────────────────────────────────────
// Character Count Thresholds
// ─────────────────────────────────────────────

export const CHAR_COUNT_WARNING_THRESHOLD = 0.8; // 80% = warning color
export const CHAR_COUNT_DANGER_THRESHOLD = 0.95; // 95% = danger color
