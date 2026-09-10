/**
 * @file animation-variants.ts
 * @module shared/config
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Animation Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Single Source of Truth for all Framer Motion animation variants,
 * transitions, and timing tokens across the application.
 *
 * Design Principles:
 *  - DRY: All values derived from shared token constants
 *  - SOLID: Factory functions enable extension without modification
 *  - Type-safe: All exports validated with `satisfies` against Framer Motion types
 *  - Accessible: Reduced motion variants included for WCAG 2.2 compliance
 *  - Documented: Full JSDoc on all exports for IntelliSense support
 *
 * @see https://www.framer.com/motion/animation/
 * @see https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
 */

import type { Variants, Transition } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AnimationConfig
 *
 * Standard shape for all animation configuration objects.
 * Enforces consistent API surface across all animation exports.
 */
export interface AnimationConfig {
  readonly variants: Variants;
  readonly transition: Transition;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Design Tokens — Single Source of Truth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DURATIONS
 *
 * Animation duration tokens in seconds.
 * Use 'fast' for micro-interactions, 'normal' for page transitions,
 * and 'slow' for complex orchestrations.
 */
export const DURATIONS = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.35,
} as const;

export type DurationKey = keyof typeof DURATIONS;

/**
 * EASINGS
 *
 * Named easing presets aligned with design system motion guidelines.
 */
export const EASINGS = {
  easeInOut: 'easeInOut',
  easeOut: 'easeOut',
  easeIn: 'easeIn',
  spring: [0.43, 0.13, 0.23, 0.96],
} as const;

export type EasingKey = keyof typeof EASINGS;

/**
 * OFFSETS
 *
 * Pixel offset tokens for directional slide animations.
 * Controls the perceived distance of motion entry/exit.
 */
export const OFFSETS = {
  sm: 10,
  md: 20,
  lg: 40,
} as const;

export type OffsetKey = keyof typeof OFFSETS;

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: Factory Functions — DRY, Extensible
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createSlideVariants
 *
 * Generates slide animation variants along a given axis.
 * Content enters from the positive offset direction,
 * and exits to the negative offset direction.
 *
 * @param axis   - CSS transform axis: 'x' (horizontal) | 'y' (vertical)
 * @param offset - Distance in pixels for initial/exit position
 *
 * @example
 * const variants = createSlideVariants('x', 20);
 * <motion.div variants={variants} initial="initial" animate="animate" exit="exit" />
 */
export function createSlideVariants(axis: 'x' | 'y', offset: number): Variants {
  return {
    initial: { opacity: 0, [axis]: offset },
    animate: { opacity: 1, [axis]: 0 },
    exit: { opacity: 0, [axis]: -offset },
  };
}

/**
 * createFadeVariants
 *
 * Generates simple fade-only variants.
 * Use when directional motion is not appropriate.
 */
export function createFadeVariants(): Variants {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };
}

/**
 * createTransition
 *
 * Generates a Framer Motion transition config from design tokens.
 *
 * @param duration - Key from DURATIONS token map
 * @param ease     - Key from EASINGS token map
 */
export function createTransition(duration: DurationKey, ease: EasingKey): Transition {
  return {
    duration: DURATIONS[duration],
    ease: EASINGS[ease] as any,
  };
}

/**
 * createScaleVariants
 *
 * Generates scale + fade variants for modals, popovers, and overlays.
 *
 * @param scaleFrom - Initial scale value (0–1)
 * @param yOffset   - Vertical offset in pixels
 */
export function createScaleVariants(scaleFrom = 0.96, yOffset: number = OFFSETS.sm): Variants {
  return {
    initial: { opacity: 0, scale: scaleFrom, y: yOffset },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: scaleFrom, y: yOffset },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: Animation Configs — Derived from Factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PageAnimations
 *
 * Full-page route transition animation.
 * Horizontal slide: enters from right, exits to left.
 * Produces directional navigation flow for SPAs.
 *
 * @example
 * <AnimatePresence mode="wait">
 *   <motion.div
 *     key={pathname}
 *     variants={PageAnimations.variants}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *     transition={PageAnimations.transition}
 *   />
 * </AnimatePresence>
 */
export const PageAnimations = {
  variants: createSlideVariants('x', OFFSETS.md),
  transition: createTransition('normal', 'easeInOut'),
} as const satisfies AnimationConfig;

/**
 * StepAnimations
 *
 * Multi-step wizard / onboarding step transitions.
 * Vertical slide: enters from below, exits upward.
 * Creates a sense of progression through sequential steps.
 *
 * @example
 * <AnimatePresence mode="wait">
 *   <motion.div
 *     key={currentStep}
 *     variants={StepAnimations.variants}
 *     initial="initial"
 *     animate="animate"
 *     exit="exit"
 *     transition={StepAnimations.transition}
 *   />
 * </AnimatePresence>
 */
export const StepAnimations = {
  variants: createSlideVariants('y', OFFSETS.sm),
  transition: createTransition('normal', 'easeOut'),
} as const satisfies AnimationConfig;

/**
 * ModalAnimations
 *
 * Modal dialog and sheet animations.
 * Scale + fade creates a "lifting" effect from center.
 *
 * @example
 * <motion.div
 *   variants={ModalAnimations.variants}
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 *   transition={ModalAnimations.transition}
 * />
 */
export const ModalAnimations = {
  variants: createScaleVariants(0.96, OFFSETS.sm),
  transition: createTransition('fast', 'easeOut'),
} as const satisfies AnimationConfig;

/**
 * FadeAnimations
 *
 * Generic fade-only animation.
 * Use for tooltips, overlays, and subtle content reveals.
 */
export const FadeAnimations = {
  variants: createFadeVariants(),
  transition: createTransition('normal', 'easeInOut'),
} as const satisfies AnimationConfig;

/**
 * ToastAnimations
 *
 * Toast / notification banner animations.
 * Subtle vertical slide with scale for polished feedback.
 */
export const ToastAnimations = {
  variants: {
    initial: { opacity: 0, y: OFFSETS.sm, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -OFFSETS.sm, scale: 0.95 },
  } satisfies Variants,
  transition: createTransition('fast', 'easeOut'),
} as const satisfies AnimationConfig;

/**
 * DrawerAnimations
 *
 * Side-drawer / panel slide-in from right edge.
 * Used for detail panels, filters, and navigation drawers.
 */
export const DrawerAnimations = {
  variants: createSlideVariants('x', OFFSETS.lg),
  transition: createTransition('normal', 'easeOut'),
} as const satisfies AnimationConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: Stagger Animations (List / Grid Orchestration)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * StaggerAnimations
 *
 * Orchestrated list/grid item animations.
 * Apply 'container' to the parent and 'item' to each child.
 *
 * @example
 * <motion.ul variants={StaggerAnimations.container} initial="initial" animate="animate">
 *   {items.map(item => (
 *     <motion.li key={item.id} variants={StaggerAnimations.item} transition={StaggerAnimations.transition}>
 *       {item.content}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 */
export const StaggerAnimations = {
  container: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.05,
      },
    },
    exit: { opacity: 0 },
  } satisfies Variants,

  item: createSlideVariants('y', OFFSETS.sm),

  transition: createTransition('normal', 'easeOut'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: Accessibility — Reduced Motion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ReducedMotionAnimations
 *
 * Minimal fade-only animation for users who have enabled
 * `prefers-reduced-motion` at the OS/browser level.
 *
 * WCAG 2.2 - Success Criterion 2.3.3: Animation from Interactions (AAA)
 *
 * Use via the `useAnimationConfig` hook which automatically
 * selects this config when reduced motion is preferred.
 *
 * @see hooks/useAnimationConfig.ts
 * @see https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
 */
export const ReducedMotionAnimations = {
  variants: createFadeVariants(),
  transition: createTransition('fast', 'easeInOut'),
} as const satisfies AnimationConfig;
