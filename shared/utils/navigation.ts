import { logger } from '@/core/telemetry/logger';

const LOG_CONTEXT = '[NavigationUtility]';

/**
 * SSR-safe navigation helper for Next.js App Router.
 * Protects window-dependent logic from throwing during server-side execution.
 */
export const navigation = {
  /**
   * Retrieves the current pathname + query search string in a safe manner.
   * Returns fallback path '/' if window is undefined.
   */
  getCurrentPath: (): string => {
    if (typeof window === 'undefined') {
      return '/';
    }
    return window.location.pathname + window.location.search;
  },

  /**
   * Retrieves the current absolute window location href.
   * Returns empty string if window is undefined.
   */
  getCurrentHref: (): string => {
    if (typeof window === 'undefined') {
      return '';
    }
    return window.location.href;
  },

  /**
   * Triggers a hard browser-level location redirect.
   * Logs a warning on the server if executed in non-browser context.
   */
  hardRedirect: (url: string): void => {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    } else {
      logger.warn(`${LOG_CONTEXT} hardRedirect called in non-browser context: ${url}`);
    }
  },
} as const;
