/**
 * Login Page Loading State
 *
 * Displays a skeleton loader while the login page performs:
 * - Server-side authentication check
 * - Cookie validation and token expiry check
 * - Redirect decision logic
 *
 * Features:
 * - WCAG 2.1 compliant with motion sensitivity support (prefers-reduced-motion)
 * - Proper ARIA live regions for screen reader announcements
 * - Responsive layout preventing cumulative layout shift (CLS)
 * - Mobile-optimized with safe-area insets
 * - Semantic HTML without redundant ARIA roles
 *
 * This improves perceived performance during server-side processing
 * and provides visual feedback during authentication state checks.
 */

import { KeyRound } from 'lucide-react';

export default function LoginLoading() {
  return (
    <div
      className="from-background to-muted/20 flex min-h-dvh items-center justify-center bg-gradient-to-br p-4 sm:p-6"
      aria-busy="true"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <section aria-label="Loading authentication page" className="w-full max-w-md space-y-6">
        {/* Back Navigation Skeleton */}
        <div
          className="bg-muted h-6 w-full max-w-32 rounded motion-safe:animate-pulse motion-reduce:opacity-60"
          aria-hidden="true"
        />

        {/* Login Card Skeleton */}
        <div className="bg-card border-border space-y-6 rounded-lg border p-6 shadow-lg sm:p-8">
          {/* Icon + Text Skeletons */}
          <div className="flex flex-col items-center space-y-4">
            {/* Icon Container */}
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
              <KeyRound
                className="text-primary/50 h-6 w-6 motion-safe:animate-pulse motion-reduce:opacity-60"
                aria-hidden="true"
              />
            </div>

            {/* Title Skeleton */}
            <div
              className="bg-muted h-8 w-full max-w-32 rounded motion-safe:animate-pulse motion-reduce:opacity-60"
              aria-hidden="true"
            />

            {/* Description Skeleton */}
            <div
              className="bg-muted h-4 w-full max-w-48 rounded motion-safe:animate-pulse motion-reduce:opacity-60"
              aria-hidden="true"
            />
          </div>

          {/* Button Skeleton */}
          <div
            className="bg-muted h-11 w-full rounded-md motion-safe:animate-pulse motion-reduce:opacity-60"
            aria-hidden="true"
          />

          {/* Security Notice Skeleton */}
          <div
            className="bg-muted mx-auto h-3 w-full max-w-64 rounded motion-safe:animate-pulse motion-reduce:opacity-60"
            aria-hidden="true"
          />
        </div>

        {/* Footer Text Skeleton */}
        <div
          className="bg-muted mx-auto h-3 w-full max-w-56 rounded motion-safe:animate-pulse motion-reduce:opacity-60"
          aria-hidden="true"
        />
      </section>

      {/* Isolated Live Region for Screen Readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Loading sign in page, please wait...
      </div>
    </div>
  );
}
