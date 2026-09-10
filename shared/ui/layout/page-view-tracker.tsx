'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { logger } from '@/core/telemetry/logger';
import { recordMetric } from '@/core/telemetry/metrics';

interface PageViewTrackerProps {
  pageType: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export function PageViewTracker({ pageType, userId, metadata = {} }: PageViewTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 🏢 ENTERPRISE: Log page view via telemetry logger
    logger.info(`Page View: ${pageType} (${pathname})`, {
      path: pathname,
      pageType,
      userId,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    recordMetric('page_view_count', 1, {
      pageType,
      path: pathname,
    });

    // Track active page session duration
    const sessionStart = Date.now();

    return () => {
      const sessionDuration = Date.now() - sessionStart;
      if (sessionDuration > 1000) {
        logger.info(`Page Session Duration: ${pageType}`, {
          pageType,
          durationMs: sessionDuration,
          userId,
        });

        recordMetric('page_session_duration_ms', sessionDuration, {
          pageType,
          userId: userId || 'anonymous',
        });
      }
    };
  }, [pathname, searchParams, pageType, userId, metadata]);

  return null;
}
