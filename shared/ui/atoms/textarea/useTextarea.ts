/**
 * @fileoverview Custom hook for Textarea component business logic.
 *
 * Architecture Decision (Separation of Concerns):
 * - All stateful logic, event handling, and side effects live here
 * - The component file becomes a pure rendering concern
 * - Enables independent testing of logic without rendering
 * - Enables reuse of logic in other textarea variants
 */

import * as React from 'react';
import { adjustTextareaHeight } from './textarea.utils';
import type { TextareaSize } from './textarea.types';

// ─────────────────────────────────────────────
// Hook Input Interface
// ─────────────────────────────────────────────

interface UseTextareaOptions {
  /** Whether auto-resize is enabled */
  autoResize: boolean;
  /** Current value for character counting */
  value?: React.TextareaHTMLAttributes<HTMLTextAreaElement>['value'];
  /** Default value for uncontrolled mode */
  defaultValue?: React.TextareaHTMLAttributes<HTMLTextAreaElement>['defaultValue'];
  /** Size variant for min-height calculation */
  size: TextareaSize;
  /** External onChange handler */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

// ─────────────────────────────────────────────
// Hook Return Interface
// ─────────────────────────────────────────────

interface UseTextareaReturn {
  /** Ref to attach to the textarea element */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Current character count (controlled & uncontrolled) */
  charCount: number;
  /** Merged onChange handler with auto-resize side effect */
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
}

// ─────────────────────────────────────────────
// MIN_HEIGHT_MAP — Design System Sizes → Pixels
// ─────────────────────────────────────────────

const MIN_HEIGHT_PX: Record<TextareaSize, number> = {
  sm: 60,
  md: 80,
  lg: 120,
} as const;

// ─────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────

/**
 * useTextarea — Encapsulates all Textarea component logic.
 *
 * Handles:
 * - Character count tracking (controlled + uncontrolled)
 * - Auto-resize behavior with proper cleanup
 * - Event handler composition
 *
 * @param options - Hook configuration
 * @returns Ref, state, and handlers for the textarea
 */
export function useTextarea({
  autoResize,
  value,
  defaultValue,
  size,
  onChange,
}: UseTextareaOptions): UseTextareaReturn {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ── Character Count State ──────────────────
  // Supports both controlled (value) and uncontrolled (defaultValue) modes
  const [internalCharCount, setInternalCharCount] = React.useState<number>(() => {
    if (typeof value === 'string') return value.length;
    if (typeof defaultValue === 'string') return defaultValue.length;
    return 0;
  });

  /**
   * Stable char count:
   * - Controlled: derived from value prop (no state needed)
   * - Uncontrolled: tracked via internal state
   */
  const charCount = React.useMemo((): number => {
    if (typeof value === 'string') return value.length;
    return internalCharCount;
  }, [value, internalCharCount]);

  // ── Auto-Resize Effect ─────────────────────
  // Runs on mount to size correctly for initial value
  React.useEffect(() => {
    if (!autoResize || !textareaRef.current) return;

    const minHeight = MIN_HEIGHT_PX[size];
    adjustTextareaHeight(textareaRef.current, minHeight);
  }, [autoResize, size]);

  // ── Resize on Value Change (Controlled Mode) ──
  React.useEffect(() => {
    if (!autoResize || !textareaRef.current) return;
    if (value === undefined) return; // Uncontrolled: handled in onChange

    const minHeight = MIN_HEIGHT_PX[size];
    adjustTextareaHeight(textareaRef.current, minHeight);
  }, [autoResize, value, size]);

  // ── Event Handler ──────────────────────────

  /**
   * Merged onChange handler.
   * Order: side effects → external handler
   * Stable reference via useCallback — prevents child re-renders.
   */
  const handleChange = React.useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(
    (event) => {
      const newValue = event.target.value;

      // Side Effect 1: Track character count (uncontrolled mode)
      if (value === undefined) {
        setInternalCharCount(newValue.length);
      }

      // Side Effect 2: Auto-resize (uncontrolled mode)
      if (autoResize && textareaRef.current) {
        const minHeight = MIN_HEIGHT_PX[size];
        adjustTextareaHeight(textareaRef.current, minHeight);
      }

      // Forward to external handler
      onChange?.(event);
    },
    [value, autoResize, size, onChange]
  );

  return {
    textareaRef,
    charCount,
    handleChange,
  };
}
