'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '@/core/telemetry/monitoring';

export function WebVitals() {
  useReportWebVitals((metric) => {
    reportWebVitals({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    });
  });

  return null;
}
