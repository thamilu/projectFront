'use client';

import { useEffect } from 'react';
import { createServiceLogger } from '@/core/telemetry/logger.factory';

const log = createServiceLogger('ProvidersTelemetry');

/**
 * useProviderTelemetry
 * Hook to trace and log client-side provider initialization health.
 */
export function useProviderTelemetry() {
  useEffect(() => {
    log.info('Application providers initialized successfully on client-side.');
  }, []);
}
