/**
 * Route wrapper providing the cross-cutting concerns every API route needs.
 *
 * Wrapping a handler gives it, uniformly:
 *
 * - a per-request correlation id, echoed in both the log line and the
 *   `X-Request-ID` response header, so "a user hit an error at 3:47pm" is
 *   traceable to an exact log entry rather than guessed at by timestamp;
 * - a request-scoped structured logger;
 * - translation of any thrown {@link ApiError} into the canonical envelope;
 * - a catch-all that logs the real cause but returns a generic message in
 *   production, so raw exception text (provider config, DB errors, internal
 *   paths — OWASP A05:2021) never reaches a browser;
 * - `Cache-Control: no-store` and hardening headers by default.
 *
 * @module shared/api/handler
 */

import type { NextRequest, NextResponse } from 'next/server';
import { getRequestLogger } from '@/core/telemetry/logger';
import { ApiError, ApiErrorCode } from './errors';
import { apiError } from './response';

/**
 * Request-scoped logger type, derived from the factory that produces it so
 * the two can never drift apart.
 */
type RequestLogger = ReturnType<typeof getRequestLogger>;

const isProd = process.env.NODE_ENV === 'production';

/** Context handed to every wrapped handler. */
export interface RouteContext {
  /** Correlation id, also returned to the client as `X-Request-ID`. */
  readonly requestId: string;
  /** Logger pre-bound with `requestId` and the route name. */
  readonly log: RequestLogger;
  /** Request path, for error envelopes. */
  readonly path: string;
}

type RouteHandler<TParams> = (
  req: NextRequest,
  ctx: RouteContext & { params: TParams }
) => Promise<NextResponse>;

/**
 * Next.js hands dynamic segments to a route as a promise in the App Router.
 * Typing it here means individual routes stop reaching for `context: any`,
 * which is what let `app/api/orders/[id]/stream` lose all type safety on the
 * one value its authorization decision depends on.
 */
interface NextRouteArgs<TParams> {
  params: Promise<TParams>;
}

/**
 * Wrap a route handler with correlation, logging and error translation.
 *
 * @param routeName Stable identifier used in log context, e.g. `payments/create-intent`.
 * @param handler   The route's actual logic. Throw {@link ApiError} to fail.
 *
 * @example
 * export const POST = withRoute('payments/create-intent', async (req, { log }) => {
 *   const caller = await requireSession(req);
 *   const body = await readValidatedBody(req, schema);
 *   log.info('Creating intent', { userId: caller.userId });
 *   return apiSuccess({ ok: true });
 * });
 */
export function withRoute<TParams = Record<string, never>>(
  routeName: string,
  handler: RouteHandler<TParams>
) {
  return async (req: NextRequest, args?: NextRouteArgs<TParams>): Promise<NextResponse> => {
    // Honour an inbound correlation id when a trusted upstream (proxy.ts)
    // already generated one, so a single id spans middleware and handler.
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const path = req.nextUrl.pathname;
    const log = getRequestLogger(requestId, { route: routeName });

    const startedAt = Date.now();

    try {
      // `params` is a promise in the App Router; resolve it once here so
      // handlers receive a plain object.
      const params = (args?.params ? await args.params : {}) as TParams;
      const response = await handler(req, { requestId, log, path, params });
      response.headers.set('X-Request-ID', requestId);
      return response;
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      // ---------- Intentional, classified failures ----------
      if (ApiError.is(error)) {
        // 4xx are caller errors and are expected traffic — logging them at
        // `error` would drown the signal that a genuine 5xx represents.
        const level = error.status >= 500 ? 'error' : 'warn';
        log[level](`[${routeName}] ${error.errorCode}`, {
          status: error.status,
          errorCode: error.errorCode,
          durationMs,
          // `cause` holds the unredacted detail; it is logged, never returned.
          cause: describeCause(error.cause),
        });
        return apiError(error, { requestId, path });
      }

      // ---------- Unanticipated failures ----------
      const rawMessage = error instanceof Error ? error.message : String(error);
      log.error(`[${routeName}] Unhandled error`, {
        error: rawMessage,
        stack: error instanceof Error ? error.stack : undefined,
        durationMs,
      });

      return apiError(
        new ApiError(
          500,
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          isProd ? 'An unexpected error occurred. Please try again.' : rawMessage
        ),
        { requestId, path }
      );
    }
  };
}

/** Render an unknown `cause` into something safe and useful in a log line. */
function describeCause(cause: unknown): string | undefined {
  if (cause === undefined || cause === null) return undefined;
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}
