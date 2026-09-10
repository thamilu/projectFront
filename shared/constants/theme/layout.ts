/**
 * Tailwind CSS Breakpoint Definitions
 *
 * SINGLE SOURCE OF TRUTH for all responsive breakpoints.
 *
 * ⚠️ CRITICAL: These values MUST stay in sync with the `screens` config in
 * `tailwind.config.ts`. If Tailwind breakpoints change, update this map first.
 *
 * Tailwind uses min-width for breakpoints (mobile-first).
 * We expose both `min` values (matching Tailwind) and `max` helpers (Tailwind breakpoint - 1).
 *
 * @see tailwind.config.ts → screens
 */
export const TAILWIND_BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const satisfies Record<string, number>;

export type TailwindBreakpoint = keyof typeof TAILWIND_BREAKPOINTS;

export const GRID_COLS_MAP = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
} as const satisfies Record<number, string>;

export type GridColsCount = keyof typeof GRID_COLS_MAP;

/**
 * Layout-related constants for consistent UI dimensions and timings.
 *
 * MOBILE_BREAKPOINT is derived from TAILWIND_BREAKPOINTS.md to enforce a
 * single source of truth. Any change to the Tailwind `md` breakpoint must
 * only be made in TAILWIND_BREAKPOINTS.
 */
export const LAYOUT_CONSTANTS = {
  /** Header height in Tailwind units (4rem = 64px) */
  HEADER_HEIGHT: 16,

  /** Duration for route change announcements (ms) */
  ROUTE_ANNOUNCEMENT_DURATION: 1000,

  /** Sidebar transition duration (ms) */
  SIDEBAR_TRANSITION_DURATION: 300,

  /**
   * Mobile breakpoint (px).
   * Derived from TAILWIND_BREAKPOINTS.md — do NOT hardcode this separately.
   * Mobile = viewport width below this value (max-width: MOBILE_BREAKPOINT - 1 px).
   */
  MOBILE_BREAKPOINT: TAILWIND_BREAKPOINTS.md,
} as const;
