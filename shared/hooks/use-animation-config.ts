'use client';

/**
 * @file use-animation-config.ts
 * @module shared/hooks
 *
 * Custom hook to select the appropriate Framer Motion animation configuration
 * based on the user's OS/browser reduced-motion accessibility settings.
 *
 * WCAG: Supports WCAG 2.3.3 — Animation from Interactions (Level AAA)
 */

import { useReducedMotion } from './use-reduced-motion';
import { AnimationConfig, ReducedMotionAnimations } from '@/shared/config/animation-variants';

/**
 * useAnimationConfig
 *
 * Returns the appropriate animation configuration based on the user's accessibility
 * preference for reduced motion.
 *
 * @param config - The animation configuration to use when motion is enabled.
 * @returns The accessibility-safe ReducedMotionAnimations if reduced motion is preferred, otherwise the standard config.
 *
 * @example
 * ```tsx
 * const pageAnim = useAnimationConfig(PageAnimations);
 * <motion.div variants={pageAnim.variants} transition={pageAnim.transition} />
 * ```
 */
export function useAnimationConfig(config: AnimationConfig): AnimationConfig {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? ReducedMotionAnimations : config;
}
