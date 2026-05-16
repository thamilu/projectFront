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
    <main 
      className="min-h-dvh flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background to-muted/20"
      aria-busy="true"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <section 
        aria-label="Loading authentication page"
        className="w-full max-w-md space-y-6"
      >
        {/* Back Navigation Skeleton */}
        <div 
          className="h-6 w-full max-w-32 bg-muted rounded motion-safe:animate-pulse motion-reduce:opacity-60" 
          aria-hidden="true"
        />

        {/* Login Card Skeleton */}
        <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-lg space-y-6">
          {/* Icon + Text Skeletons */}
          <div className="flex flex-col items-center space-y-4">
            {/* Icon Container */}
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound 
                className="h-6 w-6 text-primary/50 motion-safe:animate-pulse motion-reduce:opacity-60" 
                aria-hidden="true" 
              />
            </div>
            
            {/* Title Skeleton */}
            <div 
              className="h-8 w-full max-w-32 bg-muted rounded motion-safe:animate-pulse motion-reduce:opacity-60" 
              aria-hidden="true"
            />
            
            {/* Description Skeleton */}
            <div 
              className="h-4 w-full max-w-48 bg-muted rounded motion-safe:animate-pulse motion-reduce:opacity-60" 
              aria-hidden="true"
            />
          </div>

          {/* Button Skeleton */}
          <div 
            className="h-11 w-full bg-muted rounded-md motion-safe:animate-pulse motion-reduce:opacity-60" 
            aria-hidden="true"
          />
          
          {/* Security Notice Skeleton */}
          <div 
            className="h-3 w-full max-w-64 bg-muted rounded motion-safe:animate-pulse motion-reduce:opacity-60 mx-auto" 
            aria-hidden="true"
          />
        </div>

        {/* Footer Text Skeleton */}
        <div 
          className="h-3 w-full max-w-56 bg-muted rounded motion-safe:animate-pulse motion-reduce:opacity-60 mx-auto" 
          aria-hidden="true"
        />
      </section>

      {/* Isolated Live Region for Screen Readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        Loading sign in page, please wait...
      </div>
    </main>
  );
}

