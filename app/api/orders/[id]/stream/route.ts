/**
 * GET /api/orders/[id]/stream
 *
 * Server-Sent Events stream of status changes for a single order.
 *
 * [SECURITY] Ownership is verified before the stream opens. The previous
 * implementation carried the check only as a comment
 * (`// const order = await verifyOrderOwnership(...)`), so any authenticated
 * user could subscribe to any order id — an IDOR on order state. Verification
 * now runs against the backend as the caller, and a non-owned order is
 * reported as 404 so ids cannot be enumerated by observing 403 vs 404.
 *
 * [CORRECTNESS] The previous `subscribeToOrderUpdates()` returned a fabricated
 * subscription id and never wired a callback, so the stream emitted one
 * `connected` frame and then heartbeats forever — the feature looked live and
 * delivered nothing. Updates are now polled from the backend order resource at
 * a bounded interval and emitted only when the status actually changes.
 *
 * Polling is a deliberate choice over a push transport here: this route runs in
 * a horizontally-scaled serverless context where a per-instance Redis
 * subscription would only see events routed to that instance. When a shared
 * broker is introduced, replace `pollOrderStatus` — the framing, lifecycle and
 * authorisation around it stay as they are.
 *
 * Client: `new EventSource('/api/orders/123/stream')`
 */

import type { NextRequest } from 'next/server';
import { requireSession, ApiError, apiError } from '@/shared/api';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { getRequestLogger } from '@/core/telemetry/logger';

/**
 * Long-lived connections need the Node.js runtime; the Edge runtime caps
 * execution far below the lifetime configured here.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================
// 1. TUNING
// ============================================================

/** How often the backend is polled for a status change. */
const POLL_INTERVAL_MS = 10_000;

/** Comment-frame keepalive, below the ~60s idle timeout of most proxies. */
const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Hard lifetime cap. Without one, abandoned tabs accumulate open connections
 * and exhaust the per-instance socket budget — the previous version had no
 * limit at all. `EventSource` reconnects automatically, so a client that still
 * cares simply re-establishes.
 */
const MAX_CONNECTION_MS = 15 * 60 * 1_000;

/** Consecutive poll failures tolerated before the stream closes. */
const MAX_CONSECUTIVE_POLL_FAILURES = 3;

// ============================================================
// 2. TYPES
// ============================================================

interface OrderStatusSnapshot {
  id: number;
  status?: string;
  paymentStatus?: string;
  updatedAt?: string;
}

type StreamEvent =
  | { type: 'connected'; orderId: string; status?: string; timestamp: string }
  | { type: 'update'; orderId: string; status?: string; paymentStatus?: string; timestamp: string }
  | { type: 'error'; message: string; timestamp: string };

// ============================================================
// 3. HANDLER
// ============================================================

/**
 * Not wrapped in `withRoute()`: that helper returns a JSON envelope, whereas a
 * successful response here is a `text/event-stream` body whose lifetime
 * outlives the handler. Failures before the stream opens still use the shared
 * error envelope, so the error contract stays identical to every other route.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const path = req.nextUrl.pathname;
  const log = getRequestLogger(requestId, { route: 'orders/stream' });

  try {
    const { id } = await ctx.params;

    // Validated before use: `id` reaches a backend URL, and an unvalidated
    // value there is a path-traversal and request-forgery vector.
    const orderId = parseOrderId(id);

    const caller = await requireSession(req);

    // ---------- Authorisation gate ----------
    // Fetched as the caller, so the backend's own rules decide. A rejection
    // is collapsed to 404 to avoid confirming that an order exists.
    const initial = await loadOwnedOrder(orderId, caller.accessToken);

    log.info('Order stream opened', { orderId, userId: caller.userId });

    const stream = createOrderStream({
      orderId,
      accessToken: caller.accessToken,
      initial,
      signal: req.signal,
      onClose: (reason) => log.info('Order stream closed', { orderId, reason }),
      onError: (error) => log.warn('Order stream poll failed', { orderId, error }),
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Connection: 'keep-alive',
        // Nginx buffers proxied responses by default, which would hold SSE
        // frames until the buffer fills and defeat the whole mechanism.
        'X-Accel-Buffering': 'no',
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    const failure = ApiError.is(error)
      ? error
      : new ApiError(500, 'InternalServerError', 'Could not open the order stream.', {
          cause: error,
        });

    if (failure.status >= 500) {
      log.error('Order stream failed to open', { error: String(error) });
    }

    return apiError(failure, { requestId, path });
  }
}

// ============================================================
// 4. STREAM CONSTRUCTION
// ============================================================

interface StreamOptions {
  orderId: number;
  accessToken: string | undefined;
  initial: OrderStatusSnapshot;
  signal: AbortSignal;
  onClose: (reason: string) => void;
  onError: (error: string) => void;
}

/**
 * Build the SSE body.
 *
 * All three shutdown paths — client disconnect, lifetime cap, repeated poll
 * failure — funnel through a single idempotent `close()`. The previous version
 * cleared its heartbeat only on the abort path, so any other exit leaked an
 * interval that kept firing against a closed controller.
 */
function createOrderStream(options: StreamOptions): ReadableStream<Uint8Array> {
  const { orderId, accessToken, initial, signal, onClose, onError } = options;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let consecutiveFailures = 0;
      let lastStatus = initial.status;
      let lastPaymentStatus = initial.paymentStatus;

      const timers: ReturnType<typeof setInterval>[] = [];

      /** Idempotent teardown — safe to call from any exit path, in any order. */
      const close = (reason: string): void => {
        if (closed) return;
        closed = true;
        timers.forEach(clearInterval);
        signal.removeEventListener('abort', onAbort);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime (client vanished mid-write).
        }
        onClose(reason);
      };

      /** Enqueue one frame; a write failure means the peer is gone. */
      const send = (event: StreamEvent): void => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          close('write-failed');
        }
      };

      function onAbort(): void {
        close('client-disconnected');
      }

      signal.addEventListener('abort', onAbort);

      // Immediate frame: confirms the subscription and seeds the client with
      // current state, so the UI need not also fetch the order separately.
      send({
        type: 'connected',
        orderId: String(orderId),
        status: initial.status,
        timestamp: new Date().toISOString(),
      });

      // ---------- Keepalive ----------
      timers.push(
        setInterval(() => {
          if (closed) return;
          try {
            // A comment frame: ignored by EventSource, but enough traffic to
            // stop an intermediary reaping the connection as idle.
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          } catch {
            close('keepalive-failed');
          }
        }, HEARTBEAT_INTERVAL_MS)
      );

      // ---------- Status polling ----------
      timers.push(
        setInterval(() => {
          if (closed) return;

          void (async () => {
            try {
              const snapshot = await loadOrderSnapshot(orderId, accessToken);
              consecutiveFailures = 0;

              // Emit only on genuine change: re-sending an unchanged status
              // every interval would make the client's update handler fire
              // continuously for no reason.
              if (
                snapshot.status !== lastStatus ||
                snapshot.paymentStatus !== lastPaymentStatus
              ) {
                lastStatus = snapshot.status;
                lastPaymentStatus = snapshot.paymentStatus;
                send({
                  type: 'update',
                  orderId: String(orderId),
                  status: snapshot.status,
                  paymentStatus: snapshot.paymentStatus,
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (error) {
              consecutiveFailures += 1;
              onError(String(error));

              // Tolerate transient blips; close on a sustained outage rather
              // than holding a connection that can no longer deliver anything.
              if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
                send({
                  type: 'error',
                  message: 'Live updates are unavailable. Refresh to see the latest status.',
                  timestamp: new Date().toISOString(),
                });
                close('poll-failures-exhausted');
              }
            }
          })();
        }, POLL_INTERVAL_MS)
      );

      // ---------- Lifetime cap ----------
      const lifetime = setTimeout(() => close('max-lifetime-reached'), MAX_CONNECTION_MS);
      // Registered as an interval-shaped handle so `close()` clears it too.
      timers.push(lifetime as unknown as ReturnType<typeof setInterval>);
    },

    cancel() {
      // The consumer released the stream; `start`'s abort listener performs
      // teardown, so nothing further is required here.
    },
  });
}

// ============================================================
// 5. BACKEND ACCESS
// ============================================================

/** Parse and bound-check the route parameter before it reaches a URL. */
function parseOrderId(raw: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > Number.MAX_SAFE_INTEGER) {
    throw ApiError.notFound('Order not found.');
  }
  return parsed;
}

/**
 * Load the order as the caller and confirm it is theirs.
 *
 * A 403 and a 404 from the backend are deliberately mapped to the same 404
 * here — see the module docblock.
 */
async function loadOwnedOrder(
  orderId: number,
  accessToken: string | undefined
): Promise<OrderStatusSnapshot> {
  try {
    return await loadOrderSnapshot(orderId, accessToken);
  } catch (error) {
    const upstream = error as { status?: number } | undefined;
    if (upstream?.status === 404 || upstream?.status === 403) {
      throw ApiError.notFound('Order not found.');
    }
    if (upstream?.status === 401) {
      throw ApiError.unauthenticated();
    }
    throw ApiError.upstream('Could not open the order stream.', error);
  }
}

/** Fetch the current status snapshot. Throws the raw upstream error shape. */
async function loadOrderSnapshot(
  orderId: number,
  accessToken: string | undefined
): Promise<OrderStatusSnapshot> {
  const { data } = await serverBackendFetch<OrderStatusSnapshot | { data: OrderStatusSnapshot }>(
    API_ENDPOINTS.ORDERS.DETAIL(String(orderId)),
    accessToken
  );

  // Unwrap the envelope some backend endpoints use.
  const order = (data as { data?: OrderStatusSnapshot }).data ?? (data as OrderStatusSnapshot);

  if (!order || typeof order.id !== 'number') {
    throw { status: 404, message: 'Order not found' };
  }

  return order;
}
