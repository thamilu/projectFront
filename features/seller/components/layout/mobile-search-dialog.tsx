'use client';

import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/atoms/dialog';
import { cn } from '@/shared/utils';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * Maximum number of characters permitted in a search query.
 * Enforced via the HTML maxLength attribute and the character counter.
 */
const MAX_QUERY_LENGTH = 200;

/**
 * Show the character counter when this many characters remain.
 * Set to 20% of MAX_QUERY_LENGTH to give advance notice before truncation.
 */
const CHAR_COUNT_WARNING_THRESHOLD = Math.floor(MAX_QUERY_LENGTH * 0.2); // 40

/**
 * Minimum delay (ms) before programmatically focusing the search input
 * after the dialog opens. Allows the Radix Dialog entrance animation to
 * complete before focus is moved — required for iOS Safari compatibility.
 * Increase if focus fails on specific devices during QA.
 */
const DIALOG_FOCUS_DELAY_MS = 50;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * Top-offset class applied to the DialogContent to position it
 * directly below the seller header. Composite classes are used to
 * support responsive breakpoints correctly.
 *
 * Use a composite value (e.g. 'top-16 sm:top-20') rather than a
 * single responsive modifier to ensure the dialog is positioned
 * at all breakpoints.
 */
type DialogTopOffset =
  | 'top-14'
  | 'top-16'
  | 'top-20'
  | 'top-14 sm:top-16'
  | 'top-16 sm:top-20';

interface MobileSearchDialogProps {
  /** Whether the dialog is currently open. */
  isOpen: boolean;
  /** Callback invoked when the dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Current search query string — controlled by the parent. */
  searchQuery: string;
  /** Callback invoked on every input change with the sanitised value. */
  onSearchChange: (value: string) => void;
  /**
   * Callback invoked on form submission with the trimmed query string.
   * Signature accepts the clean query directly — the parent does not
   * need to read its own state on submit.
   */
  onSubmit: (query: string) => void;
  /**
   * Whether a search navigation transition is in progress.
   * Renamed from isSearching to align with React useTransition's isPending.
   */
  isPending?: boolean;
  /**
   * Tailwind top-offset class applied to DialogContent.
   * Defaults to 'top-16 sm:top-20' (matches the default h-16 header).
   * Pass 'top-14 sm:top-16' for the onboarding header (h-14).
   */
  dialogTopOffset?: DialogTopOffset;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

/**
 * MobileSearchDialog
 *
 * Mobile search overlay dialog for the seller dashboard header.
 * Visible only on screens narrower than the md breakpoint (md:hidden trigger).
 *
 * Accessibility conformance — WCAG 2.2 AA:
 * - 4.1.2  Dialog has an accessible name via a visually hidden DialogTitle
 * - 1.3.6  Form has role="search" and aria-label landmark
 * - 4.1.3  ARIA live region announces search-pending state to screen readers
 * - 2.5.3  Trigger aria-label reflects the current loading state
 * - 1.1.1  All decorative SVG icons carry aria-hidden="true"
 * - 2.4.7  Focus moves programmatically to the input on open (iOS Safari fallback)
 * - 2.1.1  Explicit submit button supports keyboard-only and switch-access users
 * - 2.5.5  Trigger button meets the 44 × 44 px minimum touch target
 * - 2.5.8  Clear button meets the 24 px WCAG 2.2 minimum target size
 *
 * Focus note — clear button touch target:
 *   The clear button renders at 32 × 32 px (h-8 w-8), which meets WCAG 2.5.8
 *   (24 px minimum + adequate surrounding spacing) but falls short of WCAG 2.5.5
 *   (44 px). This is an accepted tradeoff: the button is positioned inside the
 *   input field, where a 44 px target would require increasing the input height
 *   for all users. Document this decision if a formal VPAT is required.
 */
export const MobileSearchDialog = memo<MobileSearchDialogProps>(
  function MobileSearchDialog({
    isOpen,
    onOpenChange,
    searchQuery,
    onSearchChange,
    onSubmit,
    isPending = false,
    dialogTopOffset,
  }): React.JSX.Element {
    const inputRef = useRef<HTMLInputElement>(null);
    const [validationError, setValidationError] = useState('');
    const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);

    // ── Effects ──────────────────────────────

    /**
     * Manage dialog open/close side effects:
     * - On open: schedule focus movement to the search input
     * - On close: clear validation errors and submit attempt states
     *
     * Note: searchQuery is intentionally NOT cleared on close.
     * Retaining the query allows users to refine their previous search.
     */
    useEffect(() => {
      if (!isOpen) {
        setValidationError('');
        setHasSubmitAttempted(false);
        return;
      }

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, DIALOG_FOCUS_DELAY_MS);

      return () => clearTimeout(timer);
    }, [isOpen]);

    /**
     * Clear the validation error as soon as the user starts typing again.
     * The guard condition prevents a redundant setState call on every
     * keystroke when no error is currently shown.
     */
    useEffect(() => {
      if (validationError && searchQuery.trim().length > 0) {
        setValidationError('');
      }
    }, [searchQuery, validationError]);

    // ── Derived values ───────────────────────

    const isQueryEmpty = searchQuery.trim().length === 0;
    const charsRemaining = MAX_QUERY_LENGTH - searchQuery.length;
    const showCharCount = charsRemaining <= CHAR_COUNT_WARNING_THRESHOLD;

    // ── Handlers ─────────────────────────────

    /**
     * Handle form submission.
     * Validates the trimmed query before passing it to the parent.
     * onSubmit receives the clean string — the parent does not need to
     * re-read its own searchQuery state.
     *
     * Note: handleFormSubmit is recreated on each searchQuery change
     * because it reads searchQuery in the handler body. This is the
     * correct tradeoff — a ref-based approach would avoid recreation
     * but adds complexity not warranted by current performance needs.
     */
    const handleFormSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        setHasSubmitAttempted(true);
        const trimmedQuery = searchQuery.trim();

        if (trimmedQuery.length === 0) {
          setValidationError('Please enter a search term');
          inputRef.current?.focus();
          return;
        }

        setValidationError('');
        // onSubmit is expected to be a non-throwing synchronous function.
        // If onSubmit is changed to async or may throw, wrap in try/catch
        // and set validationError to surface the failure to the user.
        onSubmit(trimmedQuery);
      },
      [searchQuery, onSubmit],
    );

    /**
     * Sanitise input on change.
     * trimStart removes leading whitespace without interfering with
     * natural multi-word typing (trailing spaces are intentionally preserved).
     */
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value.trimStart());
      },
      [onSearchChange],
    );

    /** Clear the query, dismiss the validation error, and return focus to the input. */
    const handleClear = useCallback(() => {
      onSearchChange('');
      setValidationError('');
      inputRef.current?.focus();
    }, [onSearchChange]);

    // ── Render ───────────────────────────────

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        {/* ── Trigger ── */}
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 rounded-full"
            aria-label={isPending ? 'Search in progress' : 'Open search'}
            aria-busy={isPending ? true : undefined}
            aria-keyshortcuts="Meta+k Control+k"
            title="Search (⌘K / Ctrl+K)"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </DialogTrigger>

        {/* ── Dialog ── */}
        <DialogContent
          className={cn('sm:max-w-lg', dialogTopOffset ?? 'top-16 sm:top-20')}
        >
          {/*
           * Visually hidden title gives the dialog an accessible name.
           * Screen readers announce "Search the seller dashboard, dialog"
           * when the overlay opens — WCAG 4.1.2.
           */}
          <DialogHeader className="sr-only">
            <DialogTitle>Search the seller dashboard</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleFormSubmit}
            role="search"
            aria-label="Seller dashboard mobile search"
            aria-busy={isPending ? true : undefined}
            noValidate
          >
            {/*
             * ARIA live region — announces the search-pending state to
             * screen readers without requiring visual changes — WCAG 4.1.3.
             */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {isPending ? 'Searching, please wait...' : ''}
            </div>

            {/* ── Input row ── */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                {/* Leading icon — decorative, hidden from assistive technology */}
                {isPending ? (
                  <Loader2
                    className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 h-4 w-4"
                    aria-hidden="true"
                  />
                )}

                <Input
                  ref={inputRef}
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  placeholder="Search products, orders, inventory..."
                  className={cn('w-full pl-8', searchQuery.length > 0 && 'pr-10')}
                  value={searchQuery}
                  onChange={handleChange}
                  maxLength={MAX_QUERY_LENGTH}
                  disabled={isPending}
                  aria-label="Search products, orders, or inventory"
                  aria-describedby={validationError ? 'mobile-search-error' : undefined}
                  aria-invalid={
                    !hasSubmitAttempted
                      ? undefined
                      : validationError
                        ? 'true'
                        : 'false'
                  }
                />

                {/*
                 * Clear button — visible when the query is non-empty and
                 * a search is not in progress.
                 *
                 * Touch target: 32 × 32 px (h-8 w-8).
                 * Meets WCAG 2.5.8 AA (24 px minimum + spacing).
                 * Below WCAG 2.5.5 (44 px) — accepted tradeoff for an
                 * inline button constrained by the input height.
                 */}
                {searchQuery.length > 0 && !isPending && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={handleClear}
                    aria-label="Clear search query"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>

              {/*
               * Explicit submit button — required for voice-control users
               * ("Click Search") and switch-access users who cannot press Enter.
               * aria-label is applied only when visible text is absent (spinner
               * state) to satisfy WCAG 2.5.3 Label in Name.
               */}
              <Button
                type="submit"
                size="sm"
                className="shrink-0 animate-in fade-in zoom-in-95 duration-200"
                disabled={isPending || isQueryEmpty}
                aria-label={isPending ? 'Searching...' : undefined}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>

            {/*
             * Character counter — appears when charsRemaining falls to or
             * below CHAR_COUNT_WARNING_THRESHOLD (40 characters by default).
             * Uses aria-live="polite" so screen readers are notified without
             * interrupting the user's typing flow.
             * No aria-label is applied — the visible text is sufficient and
             * an aria-label would cause double-announcement on some screen readers.
             */}
            {showCharCount && (
              <p
                className={cn(
                  'text-xs mt-1 text-right tabular-nums font-medium',
                  charsRemaining <= 20
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                {charsRemaining === 0
                  ? 'Maximum length reached'
                  : `${charsRemaining} ${charsRemaining === 1 ? 'character' : 'characters'} remaining`}
              </p>
            )}

            {/*
             * Validation error — role="alert" causes screen readers to announce
             * the message immediately without waiting for the user to navigate
             * to it — WCAG 4.1.3.
             */}
            {validationError && (
              <p
                id="mobile-search-error"
                className="text-destructive text-sm mt-2 font-medium"
                role="alert"
              >
                {validationError}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);

MobileSearchDialog.displayName = 'MobileSearchDialog';
