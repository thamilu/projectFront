'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const RuntimeTelemetryPanel = dynamic(
  () => import('@/platform/observability/RuntimeTelemetryPanel'),
  { ssr: false }
);

/**
 * HydrationTracker
 * 
 * Performance Platform Utility:
 * Measures the precise time from DOMContentLoaded or page navigation start to full React client-side hydration.
 * Reports metrics to the central Observability Platform.
 */
export function HydrationTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Run after paint event to capture reliable client hydration completion time
    const measureHydration = () => {
      try {
        if (typeof window !== 'undefined' && window.performance) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            // Precise duration: elapsed time from initial HTML document completion (DOMContentLoaded) to client mounting
            const hydrationTime = Date.now() - navigation.domContentLoadedEventEnd;
            
            import('@/platform/observability').then(({ observability }) => {
              observability.trackHydrationTime(Math.max(0, hydrationTime));
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[HydrationTracker] Failed to measure hydration time:', err);
      }
    };

    // Defer execution slightly to avoid blocking the main interaction thread
    const hasIdle = typeof window !== 'undefined' && 'requestIdleCallback' in window;
    const idleId = hasIdle ? (window as any).requestIdleCallback(measureHydration) : setTimeout(measureHydration, 50);

    return () => {
      if (hasIdle) {
        (window as any).cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId as any);
      }
    };
  }, []);

  return <RuntimeTelemetryPanel />;
}

export default HydrationTracker;
