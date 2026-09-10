import { cache } from 'react';
import type { Session } from 'next-auth';

/**
 * Request-scoped session cache.
 * Deduplicates auth() within a single RSC render tree (layout + page + interceptors).
 */
export const getServerSession = cache(async (): Promise<Session | null> => {
  const { auth } = await import('@/auth');
  return auth();
});

/**
 * Returns the bearer token for server-side API calls, cached per request.
 * Securely extracts it from the server-side decrypted JWT cookie.
 */
export const getServerAccessToken = cache(async (): Promise<string | undefined> => {
  try {
    const { headers } = await import('next/headers');
    const { getToken } = await import('next-auth/jwt');

    const headersList = await headers();
    const rawToken = await getToken({
      req: { headers: headersList } as any,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });

    return rawToken?.accessToken as string | undefined;
  } catch (error) {
    const { logger } = await import('@/core/telemetry/logger');
    logger.error(
      '[Auth/ServerSession] Failed to retrieve server-side access token from JWT cookie',
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return undefined;
  }
});
