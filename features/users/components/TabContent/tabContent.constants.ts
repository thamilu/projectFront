/**
 * Card classes for the tab content area.
 *
 * Theme-aware semantic tokens (bg-card, border-border) so this correctly
 * adapts to both light and dark mode, with a blue left-strip accent for
 * depth.
 */
export const CARD_CLASSES =
  'rounded-xl bg-card border border-border/60 shadow-xs';

export const FULL_VARIANTS = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
} as const;

export const REDUCED_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
} as const;
