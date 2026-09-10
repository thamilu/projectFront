'use client';

/**
 * AuthSpinner
 *
 * Self-contained, dependency-free SVG spinner for the auth redirect screen.
 * Replaces the Lucide `Loader2` import — zero external icon library cost on
 * the most performance-critical screen in the application.
 *
 * Design:
 *   • Track ring    — static full circle (slate-700)
 *   • Animated ring — partial arc (emerald-500) rotating 360°
 *   • Center mark   — SVG lock icon (auth context semantics; no lucide dep)
 *
 * @module features/auth/components/redirects/parts/auth-spinner
 */

import { cn } from '@/shared/utils';

interface AuthSpinnerProps {
  /**
   * When `true` the arc ring rotates.
   * Pass `false` when `prefers-reduced-motion` is active.
   */
  animated?: boolean;
  /** Additional Tailwind classes on the root wrapper. */
  className?: string;
}

/**
 * SVG-based authentication spinner.
 * Entire element is `aria-hidden="true"` — purely decorative.
 */
export function AuthSpinner({ animated = true, className }: AuthSpinnerProps) {
  return (
    <div
      className={cn('relative h-16 w-16', className)}
      aria-hidden="true"
      data-testid="auth-spinner"
    >
      {/* ── Track ring — static ─────────────────────────────────── */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-700"
        />
      </svg>

      {/* ── Animated arc ring ────────────────────────────────────── */}
      {/*
       * strokeDasharray="175.9"  ≈ 2πr = 2 × π × 28 (full circumference)
       * strokeDashoffset="131.9" ≈ 75% of circumference = 25% arc visible
       * CSS animate-spin rotates the entire SVG; transformOrigin="center".
       */}
      <svg
        className={cn('absolute inset-0 h-full w-full', animated ? 'animate-spin' : 'opacity-70')}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transformOrigin: 'center' }}
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="175.9"
          strokeDashoffset="131.9"
          className="text-success"
        />
      </svg>

      {/* ── Center lock icon — auth semantic ────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-success h-6 w-6"
          focusable="false"
        >
          {/* Padlock body */}
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          {/* Padlock shackle */}
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
    </div>
  );
}
