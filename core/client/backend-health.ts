import { cache } from 'react';
import { env } from '@/env';

function resolveBackendOrigin(): string {
  return (
    env.INTERNAL_API_URL ||
    env.SPRING_BOOT_API_URL ||
    env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8082'
  ).replace(/\/+$/, '');
}

/**
 * Request-scoped backend availability probe.
 * Prevents every home/catalog section from waiting on independent timeouts when API is down.
 */
export const isBackendAvailable = cache(async (): Promise<boolean> => {
  const origin = resolveBackendOrigin();
  const probeUrl = `${origin}/api/v1/products?page=0&size=1`;

  try {
    const response = await fetch(probeUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(800),
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
});
