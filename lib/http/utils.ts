/**
 * Utility to identify if an error is due to an unreachable backend
 */
export const isBackendDown = (error: any): boolean => {
  const msg = (error?.message || '').toLowerCase();
  return (
    msg.includes('backend unreachable') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('unable to reach the server')
  );
};
