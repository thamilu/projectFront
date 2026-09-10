/**
 * RedirectingScreen — TypeScript Contracts
 *
 * Pure type definitions — this file is fully erased at compile time.
 * Contains NO runtime values. All constants → redirecting-screen.constants.ts
 *
 * @module RedirectingScreen/Types
 */

// ─── ARIA ID Shape ────────────────────────────────────────────────────────────

/**
 * Shape of the IDS runtime constant.
 * Typed here so consumers can reference the shape without importing runtime values.
 */
export type RedirectingScreenIDs = {
  readonly liveRegion: string;
  readonly description: string;
  readonly retryButton: string;
  readonly heading: string;
};

// ─── Props Interface ──────────────────────────────────────────────────────────

/**
 * Public API for `RedirectingScreen`.
 *
 * All props are optional — the component works out-of-the-box with zero config.
 * Override props to customise messaging, timeouts, and retry behaviour.
 *
 * @example
 * // Minimal usage — all defaults applied
 * <RedirectingScreen />
 *
 * @example
 * // Custom timeout with monitoring callback
 * <RedirectingScreen
 *   timeoutMs={10_000}
 *   onTimeout={() => logger.warn('Auth redirect timeout')}
 *   onRetry={() => router.push('/login?force=true')}
 * />
 *
 * @example
 * // i18n usage — override text props
 * <RedirectingScreen
 *   title={t('auth.redirecting.title')}
 *   description={t('auth.redirecting.description')}
 *   timeoutTitle={t('auth.timeout.title')}
 *   timeoutDescription={t('auth.timeout.description')}
 * />
 *
 * @example
 * // Overlay usage — prevent duplicate h1 when page already has one
 * <RedirectingScreen headingLevel={2} />
 */
export interface RedirectingScreenProps {
  /** Heading shown while redirect is in progress. */
  title?: string;
  /** Heading shown after the timeout fires. */
  timeoutTitle?: string;
  /** Body copy shown while redirect is in progress. */
  description?: string;
  /** Body copy shown after the timeout fires. */
  timeoutDescription?: string;
  /** Label for the "Encrypted Connection" badge row. */
  badgeLabel?: string;
  /** Whether to render the badge row at all. @default true */
  showBadge?: boolean;
  /**
   * Milliseconds before the timeout state is triggered.
   *
   * Must be a positive finite number. Values ≤ 0, NaN, or Infinity will
   * produce a console.error in development and fall back to the default.
   *
   * Recommended range: 5 000 – 30 000 ms
   *   - Below 5 s: false positives on slow connections
   *   - Above 30 s: poor UX, users abandon the flow
   *
   * @default 15_000
   * @minimum 1
   */
  timeoutMs?: number;
  /**
   * HTML heading level for the card title.
   *
   * - Use `1` when this screen fully replaces the page (redirect scenario).
   * - Use `2` when overlaying a page that already has an `<h1>`.
   *
   * Incorrect heading levels:
   *   - Cause duplicate `<h1>` elements → W3C validation failure
   *   - Break screen reader heading navigation
   *   - Fail WCAG 1.3.1 (Info and Relationships)
   *
   * @default 1
   */
  headingLevel?: 1 | 2 | 3;
  /**
   * Called when the timeout fires (before retry UI appears).
   * Use this to log the event or alert monitoring systems.
   *
   * @example
   * onTimeout={() => logger.warn('auth_redirect_timeout', { timeoutMs })}
   */
  onTimeout?: () => void;
  /**
   * Called when the user clicks "Retry Connection".
   *
   * Defaults to `window.location.reload()` via a browser-environment guard.
   * Override to implement a custom retry strategy.
   *
   * @example
   * // Navigate to login page instead of reloading
   * onRetry={() => router.push('/login?force=true')}
   *
   * @example
   * // Log before retrying
   * onRetry={() => {
   *   analytics.track('auth_retry_clicked');
   *   window.location.reload();
   * }}
   *
   * ⚠️  Wrap in useCallback to preserve React.memo benefits on the consumer side.
   */
  onRetry?: () => void;
  /** Additional Tailwind classes applied to the glassmorphic card. */
  className?: string;
}

// ─── Defaults Shape ───────────────────────────────────────────────────────────

/**
 * Shape for the REDIRECTING_SCREEN_DEFAULTS constant.
 *
 * Uses `Pick` (not `Omit`) — explicit enumeration of which props receive
 * primitive defaults. Adding a new prop to the interface does NOT silently
 * skip defaults; the developer must consciously add or exclude it here.
 *
 * `Readonly` makes mutation intent explicit at the type level.
 */
export type RedirectingScreenPrimitiveDefaults = Readonly<
  Pick<
    Required<RedirectingScreenProps>,
    | 'title'
    | 'timeoutTitle'
    | 'description'
    | 'timeoutDescription'
    | 'badgeLabel'
    | 'showBadge'
    | 'timeoutMs'
    | 'headingLevel'
  >
>;
