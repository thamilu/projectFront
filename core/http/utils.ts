/**
 * Utility to identify if an error is due to an unreachable backend
 */
export const isBackendDown = (error: unknown): boolean => {
  const msg = String(
    (error as { message?: string })?.message ?? (error as Error)?.message ?? ''
  ).toLowerCase();
  return (
    msg.includes('backend unreachable') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('unable to reach the server') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('circuit breaker') ||
    msg.includes('circuit is open') ||
    msg.includes('econnaborted')
  );
};
