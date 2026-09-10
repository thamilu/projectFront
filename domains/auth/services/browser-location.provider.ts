// ============================================================
// features/auth/services/browser-location.provider.ts
// Abstracts direct window.location access for testability.
// Inject IBrowserLocation instead of accessing window directly.
// ============================================================

// ─── Interface ────────────────────────────────────────────────

/**
 * Abstracts browser location APIs.
 * Implement with a mock in unit tests to avoid window globals.
 */
export interface IBrowserLocation {
  /** Returns the current URL pathname (e.g. '/dashboard') */
  getPathname(): string;
  /** Performs a full-page navigation to `url` (mirrors next-auth's own redirect:true behavior). */
  navigate(url: string): void;
}

// ─── Default Implementation ───────────────────────────────────

/**
 * Production implementation reading from window.location.
 * Gracefully falls back to '/' in non-browser environments (SSR).
 */
export const defaultBrowserLocation: IBrowserLocation = {
  getPathname(): string {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  },
  navigate(url: string): void {
    if (typeof window === 'undefined') return;
    window.location.href = url;
  },
};

// ─── Test Helper ─────────────────────────────────────────────

/**
 * Factory for creating test-safe location mocks.
 *
 * @example
 * const navigateSpy = jest.fn();
 * const location = createMockBrowserLocation('/checkout', navigateSpy);
 * const service = createAuthService({ browserLocation: location });
 */
export function createMockBrowserLocation(
  pathname: string,
  navigate: (url: string) => void = () => {}
): IBrowserLocation {
  return { getPathname: () => pathname, navigate };
}
