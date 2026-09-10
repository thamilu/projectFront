/**
 * Analytics Provider
 *
 * Provides analytics tracking for user interactions.
 * Integrates with Google Analytics, Mixpanel, or custom analytics.
 *
 * @module components/providers/analytics-provider
 */

'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { logger } from '@/core/telemetry/logger';

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Page view tracking
 */
function trackPageView(url: string) {
  // Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      'config',
      process.env.NEXT_PUBLIC_GA_ID!,
      {
        page_path: url,
      }
    );
  }

  logger.debug('Page view tracked', { url });
}

/**
 * Analytics Provider Component
 *
 * Automatically tracks page views and provides analytics context safely
 * without triggering Next.js static prerender bailouts.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  // Track page views safely on client
  useEffect(() => {
    if (!pathname) return;

    const search = typeof window !== 'undefined' ? window.location.search : '';
    const url = pathname + search;
    trackPageView(url);
  }, [pathname]);

  return <>{children}</>;
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
      'event',
      eventName,
      eventParams
    );
  }

  logger.debug('Event tracked', { eventName, eventParams });
}

/**
 * Identify user for analytics
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('set', { user_id: userId });
  }

  logger.debug('User identified', { userId, traits });
}
