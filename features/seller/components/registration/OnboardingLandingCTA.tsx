'use client';

/**
 * OnboardingLandingCTA — Seller Onboarding Call-to-Action Link
 *
 * Renders a CTA link element used across the seller registration landing page.
 * Handles both internal (Next.js client-side routed) and external (standard anchor)
 * navigation targets with full security sanitization, GDPR-compliant analytics
 * tracking, and WCAG AA accessibility.
 *
 * **Security**: All `ctaLink` values are sanitized at runtime via `sanitizeUrl`
 * to prevent XSS (`javascript:`), open redirect (`//evil.com`), and protocol
 * injection (`data:`, `vbscript:`) attacks. Blocked URLs are silently replaced
 * with `#` and logged to production telemetry.
 *
 * **Analytics**: Click tracking fires asynchronously via `navigator.sendBeacon`
 * for guaranteed delivery on page unload. GDPR analytics consent is checked
 * before any event is dispatched. Double-click prevention ensures a single
 * tracking event per user action.
 *
 * **Routing**: Internal URLs (`/path`, `#hash`) render as Next.js `<Link>` for
 * client-side navigation. External URLs (`https://...`) render as `<a>` with
 * `target="_blank"` and `rel="noopener noreferrer"`.
 *
 * @module features/seller/components/registration/OnboardingLandingCTA
 *
 * @example
 * ```tsx
 * <OnboardingLandingCTA
 *   ctaLink="/seller/register?flow=wizard"
 *   position="top"
 *   ariaLabel="Start selling free — register now"
 *   className="bg-primary text-white rounded-xl px-8 h-14"
 * >
 *   Start Selling Free
 * </OnboardingLandingCTA>
 * ```
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/utils';
import { warnOnce } from '@/shared/utils/dev-warning';
import { sanitizeUrl, isExternalUrl } from '@/shared/utils/sanitize-url';
import { useCtaTracking } from '../../hooks/useCtaTracking';

/**
 * Props for the OnboardingLandingCTA component.
 */
export interface OnboardingLandingCTAProps {
  /**
   * The navigation target URL. Sanitized at runtime — dangerous protocols
   * (`javascript:`, `data:`, etc.) are blocked and replaced with `#`.
   */
  ctaLink: string;

  /**
   * Optional CSS class names to merge with the component's baseline focus
   * ring styles. Merged using `cn()` (clsx + tailwind-merge).
   */
  className?: string;

  /** Child content rendered inside the link element. */
  children: React.ReactNode;

  /**
   * Position of this CTA on the page. Used for analytics event segmentation
   * and as the default `data-testid` suffix.
   */
  position: 'top' | 'bottom' | 'pricing';

  /**
   * Subscription plan name associated with this CTA. Included in the analytics
   * payload. Defaults to `'unknown'` if not provided.
   */
  planName?: string;

  /**
   * Accessible label for screen readers. Recommended when `children` contains
   * non-text content (e.g., icons). If omitted and `children` is not a string,
   * a development warning is emitted.
   */
  ariaLabel?: string;

  /**
   * ID of an element that describes this CTA for screen readers.
   * Maps to `aria-describedby` on the rendered element.
   */
  ariaDescribedBy?: string;

  /**
   * Custom test ID for automated testing. Defaults to `cta-${position}`
   * if not provided.
   */
  dataTestId?: string;
}

/** Baseline focus ring classes — always applied regardless of caller className. */
const FOCUS_RING_CLASSES =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded';

/**
 * OnboardingLandingCTA — Enterprise CTA link with security, analytics, and a11y.
 *
 * @see {@link OnboardingLandingCTAProps} for full prop documentation.
 */
const OnboardingLandingCTA = React.memo(function OnboardingLandingCTA({
  ctaLink,
  className,
  children,
  position,
  planName,
  ariaLabel,
  ariaDescribedBy,
  dataTestId,
}: OnboardingLandingCTAProps): React.JSX.Element {
  // ── URL sanitization ───────────────────────────────────────────────────
  const safeHref = useMemo(() => sanitizeUrl(ctaLink), [ctaLink]);
  const isExternal = isExternalUrl(safeHref);

  // ── Analytics tracking ─────────────────────────────────────────────────
  const handleClick = useCtaTracking({ position, planName });

  // ── Accessible name enforcement (dev-only) ────────────────────────────
  const hasTextChildren = typeof children === 'string' && children.trim().length > 0;
  if (!ariaLabel && !hasTextChildren) {
    warnOnce(
      `OnboardingLandingCTA-${position}-a11y`,
      'warn',
      `[OnboardingLandingCTA] Link at position="${position}" may lack an accessible name. ` +
        'Provide an ariaLabel prop or use text children.'
    );
  }

  // ── Shared element props ───────────────────────────────────────────────
  const testId = dataTestId ?? `cta-${position}`;
  const mergedClassName = cn(FOCUS_RING_CLASSES, className);
  const sharedProps = {
    className: mergedClassName,
    onClick: handleClick,
    'data-testid': testId,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
  };

  // ── Render: blocked URL → plain anchor (never <Link> for '#') ─────────
  if (safeHref === '#') {
    return (
      <a href="#" {...sharedProps}>
        {children}
      </a>
    );
  }

  // ── Render: external URL → anchor with security attributes ────────────
  if (isExternal) {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        {...sharedProps}
      >
        {children}
      </a>
    );
  }

  // ── Render: internal URL → Next.js <Link> for client-side routing ─────
  return (
    <Link href={safeHref} {...sharedProps}>
      {children}
    </Link>
  );
});

OnboardingLandingCTA.displayName = 'OnboardingLandingCTA';

export { OnboardingLandingCTA };
export default OnboardingLandingCTA;
