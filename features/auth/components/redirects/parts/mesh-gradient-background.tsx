'use client';

/**
 * MeshGradientBackground
 *
 * Decorative animated dual-orb background for the redirect screen.
 * Extracted from the main component to enforce single responsibility
 * and keep `redirecting-screen.tsx` under the 200-line hard limit.
 *
 * Performance:
 *   • `data-decorative-bg` — suppressed by the project's `prefers-reduced-data`
 *     CSS rule in `accessibility.css` (background-image: none).
 *   • `aria-hidden="true"` — excluded from the AT tree.
 *   • GPU-composited keyframes (transform + opacity only).
 *   • When `animated=false` the orbs render statically (no layout shift).
 *
 * @module features/auth/components/redirects/parts/mesh-gradient-background
 */

import { cn } from '@/shared/utils';

interface MeshGradientBackgroundProps {
  /** Animate the orbs (pass `false` when prefers-reduced-motion is active). */
  animated?: boolean;
}

/**
 * Dual radial-gradient ambient background.
 * Fully decorative — invisible to screen readers and data-saver mode.
 */
export function MeshGradientBackground({ animated = true }: MeshGradientBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true" data-decorative-bg>
      {/* Primary orb — top-left quadrant */}
      <div
        className={cn(
          'absolute -top-1/2 -left-1/2 h-[200%] w-[200%]',
          'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',
          'from-success/20 via-transparent to-transparent blur-3xl',
          animated && 'animate-mesh-orb-a'
        )}
      />
      {/* Secondary orb — bottom-right quadrant */}
      <div
        className={cn(
          'absolute -right-1/2 -bottom-1/2 h-[200%] w-[200%]',
          'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',
          'from-primary/20 via-transparent to-transparent blur-3xl',
          animated && 'animate-mesh-orb-b'
        )}
      />
    </div>
  );
}
