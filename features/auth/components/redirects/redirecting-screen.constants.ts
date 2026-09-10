/**
 * RedirectingScreen — Runtime Constants
 *
 * All runtime values for the redirect screen feature.
 * Pure type definitions → redirecting-screen.types.ts
 *
 * @module RedirectingScreen/Constants
 */

import type {
  RedirectingScreenIDs,
  RedirectingScreenPrimitiveDefaults,
} from './redirecting-screen.types';

// ─── ARIA Element IDs ─────────────────────────────────────────────────────────

/**
 * Stable HTML element IDs that couple ARIA attributes across the component tree.
 *
 * All IDs are prefixed with 'redirecting-' to prevent collisions with other
 * components rendered on the same page.
 *
 * `as const` preserves literal types for autocomplete and strict type checking.
 * `satisfies RedirectingScreenIDs` validates the shape at definition — typos
 * in key names produce a compile error here, not silently at the usage site.
 */
export const IDS = {
  /** sr-only live region — screen readers announce on content change */
  liveRegion: 'redirecting-live-region',
  /** Body paragraph — linked via aria-describedby on card and retry button */
  description: 'redirecting-description',
  /** Retry button — receives programmatic focus on timeout */
  retryButton: 'redirecting-retry-button',
  /** Card heading — card landmark labelled via aria-labelledby */
  heading: 'redirecting-heading',
} as const satisfies RedirectingScreenIDs;

// ─── Component Defaults ───────────────────────────────────────────────────────

/**
 * Production-grade defaults for every configurable primitive prop.
 *
 * `as const` preserves literal types so consumers benefit from autocomplete.
 * `satisfies RedirectingScreenPrimitiveDefaults` validates the shape at
 * definition — if RedirectingScreenProps gains a new prop listed in
 * RedirectingScreenPrimitiveDefaults, a compile error fires here, forcing
 * a conscious decision about the default value.
 *
 * Text values are intentionally concise and non-technical.
 * Override via props for custom messaging or i18n.
 *
 * @see RedirectingScreenProps for full prop documentation
 */
export const REDIRECTING_SCREEN_DEFAULTS = {
  title: 'Redirecting to Secure Login',
  timeoutTitle: 'Connection Timeout',
  description: 'Please wait while we securely connect you to the authentication provider.',
  /**
   * Short, user-friendly, non-technical timeout message.
   * Fits a single line on max-w-md (448px) mobile cards.
   * Full technical message available as TIMEOUT_DESCRIPTION_VERBOSE below.
   */
  timeoutDescription: 'Taking longer than expected. Please retry or contact support.',
  badgeLabel: 'Encrypted Connection',
  showBadge: true,
  timeoutMs: 15_000,
  headingLevel: 1,
} as const satisfies RedirectingScreenPrimitiveDefaults;

/**
 * Full technical timeout message for enterprise / admin-facing deployments.
 * Use this when your audience is IT staff who benefit from specific terminology.
 *
 * @example
 * <RedirectingScreen
 *   timeoutDescription={TIMEOUT_DESCRIPTION_VERBOSE}
 * />
 */
export const TIMEOUT_DESCRIPTION_VERBOSE =
  'The connection to the authentication server is taking longer than usual. ' +
  'Please try refreshing the page or contact your system administrator if the issue persists.';
