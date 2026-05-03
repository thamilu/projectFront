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
import { usePathname, useSearchParams } from 'next/navigation';
import { logger } from '@/lib/observability/logger';

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Page view tracking
 */
function trackPageView(url: string) {
  // Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_path: url,
    });
  }

  logger.debug('Page view tracked', { url });
}

/**
 * Analytics Provider Component
 * 
 * Automatically tracks page views and provides analytics context.
 * 
 * @example
 * ```tsx
 * <AnalyticsProvider>
 *   <App />
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/**
 * Track custom event
 * 
 * @example
 * ```tsx
 * trackEvent('button_click', { button_name: 'checkout' });
 * ```
 */
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', eventName, eventParams);
  }

  logger.debug('Event tracked', { eventName, eventParams });
}

/**
 * Identify user for analytics
 * 
 * @example
 * ```tsx
 * identifyUser('user-123', { email: 'user@example.com' });
 * ```
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('set', { user_id: userId });
  }

  logger.debug('User identified', { userId, traits });
}
