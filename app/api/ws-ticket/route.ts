/**
 * Server-side API route to obtain a short-lived, single-use WebSocket
 * connection ticket.
 *
 * Unlike /api/get-token (which hands the browser the real, long-lived
 * backend access token — necessary there because a raw WebSocket handshake
 * can't rely on proxy.ts's server-side Authorization-header injection the
 * way ordinary fetch()/axios calls to /api/v1/* can), this route requests a
 * short-lived (default 45s), single-use ticket from the backend, scoped
 * only to authenticating one WebSocket connection. The real access token
 * never leaves the server for this flow: it's used here, server-side only,
 * to call the backend's ticket-mint endpoint, and only the resulting ticket
 * is returned to the browser.
 *
 * Usage: `GET /api/ws-ticket` → `{ ticket: string, expiresInSeconds: number }`
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerAccessToken } from '@/core/auth/server-session';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { getRequestLogger } from '@/core/telemetry/logger';
import { limit } from '@/shared/utils/rate-limit';
import { AuthErrorCode } from '@/auth';

const isProd = process.env.NODE_ENV === 'production';

interface WsTicketBackendResponse {
  ticket: string;
  expiresInSeconds: number;
}

/**
 * Structured error response, matching the convention established in
 * app/api/auth/[...nextauth]/route.ts and app/api/get-token/route.ts.
 */
function errorResponse(
  status: number,
  errorCode: string,
  message: string,
  requestId: string,
  path: string
) {
  return NextResponse.json(
    { timestamp: new Date().toISOString(), status, errorCode, message, path, requestId },
    { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const path = req.nextUrl.pathname;
  const log = getRequestLogger(requestId, { route: 'ws-ticket' });

  try {
    const accessToken = await getServerAccessToken();
    if (!accessToken) {
      return errorResponse(401, 'NotAuthenticated', 'Not authenticated', requestId, path);
    }

    // Rate limited per-token (a WS reconnect loop re-requesting a ticket on
    // every attempt is exactly the traffic pattern this guards) — same
    // baseline control as /api/get-token, this endpoint also hands out a
    // usable (if narrowly-scoped) credential.
    const rateLimitResult = await limit(`ws-ticket:${accessToken.slice(-16)}`);
    if (!rateLimitResult.success) {
      log.warn('[Auth/WsTicket] Rate limit exceeded');
      return errorResponse(
        429,
        'RateLimitExceeded',
        'Too many ticket requests. Please try again shortly.',
        requestId,
        path
      );
    }

    const result = await serverBackendFetch<WsTicketBackendResponse>(
      '/api/v1/ws/ticket',
      accessToken,
      { method: 'POST' }
    );

    return NextResponse.json(
      { ticket: result.data.ticket, expiresInSeconds: result.data.expiresInSeconds },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    // serverBackendFetch throws a plain { status, message } object (not an
    // Error instance) on a non-OK backend response — handled explicitly so
    // a 401/429 from the backend maps to the same status here, not a blanket 500.
    const backendError = error as { status?: number; message?: string } | undefined;
    if (typeof backendError?.status === 'number') {
      return errorResponse(
        backendError.status,
        'WsTicketRequestFailed',
        isProd ? 'Unable to issue a connection ticket. Please try again.' : backendError.message ?? 'Unknown error',
        requestId,
        path
      );
    }

    const rawMessage = error instanceof Error ? error.message : String(error);
    log.error('[Auth/WsTicket] Failed to obtain WebSocket ticket', { error: rawMessage });
    return errorResponse(
      500,
      AuthErrorCode.INTERNAL_SERVER_ERROR,
      isProd ? 'An unexpected error occurred. Please try again.' : rawMessage,
      requestId,
      path
    );
  }
}
