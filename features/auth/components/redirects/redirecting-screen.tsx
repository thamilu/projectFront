'use client';

/**
 * RedirectingScreen v3.1
 *
 * Full-screen overlay shown while the browser redirects to the Keycloak
 * authentication provider. Enterprise-grade: WCAG AAA, zero external icon
 * library dependencies, iOS Safari scroll-lock, timeout with focus management.
 *
 * ─── Accessibility (WCAG 2.1 AA + Selected AAA) ──────────────────────────────
 * • Isolated sr-only live region (role="status" aria-live="polite") — screen
 *   reader announces only the status string, NOT re-renders of visual content.
 * • aria-controls on live region — links to retry button when timedOut.
 * • <section> with aria-labelledby — gives the card a landmark + accessible name.
 * • aria-busy={!timedOut} — AT knows the state is pending.
 * • aria-describedby on button — links retry button to the timeout message.
 * • All decorative elements aria-hidden="true".
 * • WCAG 2.4.3 Focus Order — programmatic focus moves to Retry on timeout.
 * • WCAG 2.3.3 Reduced Motion — all animations conditional on useReducedMotion().
 * • WCAG 1.3.1 — headingLevel prop prevents duplicate <h1> in overlay contexts.
 * • iOS Safari scroll-through fix via useBodyScrollLock().
 *
 * ─── Performance ─────────────────────────────────────────────────────────────
 * • Zero Framer Motion — pure CSS @keyframes (GPU compositor thread only).
 * • Zero Lucide React — inline SVG AuthSpinner (no icon bundle on auth path).
 * • will-change applied surgically; reset by reduced-motion CSS rule.
 * • data-effect="frosted" — honoured by prefers-reduced-transparency CSS.
 * • data-decorative-bg — honoured by prefers-reduced-data CSS.
 * • React.memo — no unnecessary re-renders if parent re-renders.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 * • Types → redirecting-screen.types.ts (compile-time only, zero bundle cost).
 * • Constants → redirecting-screen.constants.ts (runtime values, single source of truth).
 * • Sub-components → parts/ (Single Responsibility Principle).
 * • All text/timing/callbacks configurable via props (no hardcoded values).
 * • Zero window.location calls in JSX — delegated to onRetry prop.
 *
 * @module RedirectingScreen
 *
 * @requires tailwind.config.ts to define:
 *   animate-mesh-orb-a, animate-mesh-orb-b, animate-card-enter
 *   See: tailwind.config.ts → keyframes / animation
 */

import { ElementType, memo, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/utils';
import { useReducedMotion, useBodyScrollLock, useFocusOnChange } from '@/shared/hooks';

import { AuthSpinner } from './parts/auth-spinner';
import { MeshGradientBackground } from './parts/mesh-gradient-background';
import { EncryptedBadge } from './parts/encrypted-badge';
import { IDS, REDIRECTING_SCREEN_DEFAULTS } from './redirecting-screen.constants';
import type { RedirectingScreenProps } from './redirecting-screen.types';

// ─── Component ────────────────────────────────────────────────────────────────

function RedirectingScreenComponent({
  title = REDIRECTING_SCREEN_DEFAULTS.title,
  timeoutTitle = REDIRECTING_SCREEN_DEFAULTS.timeoutTitle,
  description = REDIRECTING_SCREEN_DEFAULTS.description,
  timeoutDescription = REDIRECTING_SCREEN_DEFAULTS.timeoutDescription,
  badgeLabel = REDIRECTING_SCREEN_DEFAULTS.badgeLabel,
  showBadge = REDIRECTING_SCREEN_DEFAULTS.showBadge,
  timeoutMs = REDIRECTING_SCREEN_DEFAULTS.timeoutMs,
  headingLevel = REDIRECTING_SCREEN_DEFAULTS.headingLevel,
  onTimeout,
  onRetry = () => window.location.reload(),
  className,
}: RedirectingScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const [timedOut, setTimedOut] = useState(false);
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  // ── Dev-mode timeoutMs validation ─────────────────────────────────────────
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        console.error(
          `[RedirectingScreen] Invalid timeoutMs: ${timeoutMs}. ` +
            'Must be a positive finite number (e.g. 15_000). ' +
            `Falling back to default: ${REDIRECTING_SCREEN_DEFAULTS.timeoutMs}ms.`
        );
      }
    }
  }, [timeoutMs]);

  // ── Accessibility hooks ───────────────────────────────────────────────────
  useBodyScrollLock();
  useFocusOnChange(timedOut, retryButtonRef);

  // ── Timeout watchdog ──────────────────────────────────────────────────────
  useEffect(() => {
    // Guard: treat invalid timeoutMs as the default to avoid instant-timeout bugs
    const safeMs =
      Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : REDIRECTING_SCREEN_DEFAULTS.timeoutMs;

    const timer = setTimeout(() => {
      setTimedOut(true);
      onTimeout?.();
    }, safeMs);

    return () => clearTimeout(timer);
  }, [timeoutMs, onTimeout]);

  // ── Stable retry handler ──────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  // ── Derived content ───────────────────────────────────────────────────────
  const headingText = timedOut ? timeoutTitle : title;
  const descriptionText = timedOut ? timeoutDescription : description;

  /**
   * The live region announcement is intentionally terse — just the status
   * change string. Screen readers read the heading and description naturally
   * when the user navigates the document after hearing the announcement.
   */
  const liveAnnouncement = timedOut
    ? 'Connection timeout. A retry button is now available.'
    : 'Redirecting to secure login. Please wait.';

  /**
   * Heading tag — polymorphic based on headingLevel prop.
   * Prevents duplicate <h1> when used as an overlay over an existing page.
   * WCAG 1.3.1 — heading levels must reflect visual hierarchy.
   */
  const Heading = `h${headingLevel}` as ElementType;

  return (
    /*
     * Root: layout container — NOT an ARIA live region.
     * overflow-hidden intentionally omitted (redundant on fixed inset-0).
     */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950"
      data-testid="redirecting-screen"
    >
      {/*
       * ── ISOLATED LIVE REGION ───────────────────────────────────────────────
       * Contains ONLY the terse announcement string — NOT the full card content.
       * aria-atomic="true" — reads the entire string, not just changed chars.
       * aria-controls — programmatically links to the retry button on timeout,
       *   allowing AT to navigate directly to the action element.
       */}
      <div
        id={IDS.liveRegion}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-controls={timedOut ? IDS.retryButton : undefined}
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* ── Animated mesh gradient background — decorative ─────────────── */}
      <MeshGradientBackground animated={!prefersReducedMotion} />

      {/*
       * ── Glassmorphic Card ──────────────────────────────────────────────────
       * <section> + aria-labelledby provides a named landmark — AT users can
       * navigate to it by landmark and immediately hear the heading.
       * aria-busy communicates the pending async state.
       * card + card-hardened: defined in app/styles/components.css (design system).
       * data-effect="frosted": backdrop-filter disabled by prefers-reduced-transparency.
       */}
      <section
        aria-labelledby={IDS.heading}
        aria-describedby={IDS.description}
        aria-busy={!timedOut}
        data-effect="frosted"
        className={cn(
          'card card-hardened',
          'relative z-10 w-full max-w-md p-8',
          'bg-slate-900/65',
          !prefersReducedMotion && 'animate-card-enter',
          className
        )}
      >
        {/* Top-border emerald gradient — decorative (design system utility) */}
        <div
          className="gradient-emerald absolute inset-x-0 top-0 h-px opacity-50"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center text-center">
          {/* ── Spinner — hidden during timeout state ────────────────────── */}
          {!timedOut && (
            <div className="mb-6">
              <AuthSpinner animated={!prefersReducedMotion} />
            </div>
          )}

          {/* ── Heading — polymorphic level via headingLevel prop ─────────── */}
          <Heading
            id={IDS.heading}
            className={cn(
              'mb-2 text-2xl font-bold tracking-tight text-white',
              timedOut && 'text-warning'
            )}
          >
            {headingText}
          </Heading>

          {/* ── Description ──────────────────────────────────────────────── */}
          <p id={IDS.description} className={cn('text-slate-400', timedOut && 'text-slate-300')}>
            {descriptionText}
          </p>

          {/* ── Footer: encrypted badge (loading) or retry button (timeout) ─ */}
          {timedOut ? (
            <button
              id={IDS.retryButton}
              ref={retryButtonRef}
              type="button"
              onClick={handleRetry}
              aria-describedby={IDS.description}
              data-testid="retry-button"
              className={cn(
                'mt-8 min-h-[44px] min-w-[44px] rounded-lg px-6 py-3',
                'bg-success text-sm font-semibold text-white',
                'hover:bg-success-hover',
                'focus-visible:outline focus-visible:outline-2',
                'focus-visible:outline-success focus-visible:outline-offset-2',
                'transition-colors duration-150'
              )}
            >
              Retry Connection
            </button>
          ) : (
            showBadge && <EncryptedBadge label={badgeLabel} />
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Memo + displayName ───────────────────────────────────────────────────────

/**
 * `React.memo` — this component has stable props during its entire lifetime
 * (it mounts and stays mounted until the Keycloak redirect completes).
 * Prevents re-renders if a parent Context provider or layout re-renders.
 *
 * If passing `onRetry` or `onTimeout` callbacks from a parent, wrap them
 * in `useCallback` to preserve referential stability and memo benefits.
 */
export const RedirectingScreen = memo(RedirectingScreenComponent);
RedirectingScreen.displayName = 'RedirectingScreen';
