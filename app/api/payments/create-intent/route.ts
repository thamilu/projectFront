/**
 * POST /api/payments/create-intent
 *
 * Creates (or returns the existing) Stripe payment intent for an order.
 *
 * [SECURITY] Two properties of this route are load-bearing and must not be
 * relaxed:
 *
 * 1. **The amount is never accepted from the client.** A previous version took
 *    `amount` and `currency` from the request body and forwarded them to the
 *    backend unchanged, so a shopper could place a real order and then create
 *    an intent for any smaller sum — paying £0.01 for a £1,000 basket. The
 *    payable figure is now read from the stored order, server-side, and the
 *    request contract no longer has an `amount` field at all. There is
 *    deliberately no way to express the old behaviour.
 *
 * 2. **Ownership is asserted before anything else.** The previous version
 *    checked only that *a* session existed, so any authenticated user could
 *    create an intent against any order id (IDOR). The order is now fetched as
 *    the caller and a mismatch is reported as 404, not 403, so order ids
 *    cannot be enumerated by observing which ones return "forbidden".
 *
 * Request body:  `{ orderId: number }`
 * Response 201:  `{ clientSecret, paymentIntentId, amount, currency }`
 */

import { z } from 'zod';
import {
  withRoute,
  requireSession,
  readValidatedBody,
  enforceRateLimit,
  apiSuccess,
  ApiError,
  mapUpstreamError,
} from '@/shared/api';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { env } from '@/env';

// ============================================================
// 1. CONTRACT
// ============================================================

/**
 * `orderId` is a plain positive integer: `OrderDTO.id`
 * (domains/order/contracts/order.types.ts) is numeric, never a UUID — an
 * earlier revision validated it as `z.string().uuid()`, which every real
 * order id would have failed.
 *
 * Note what is absent: no `amount`, no `currency`, no `description`. All three
 * are derived server-side. Widening this schema is how the price-tampering
 * vulnerability would return.
 */
const createIntentSchema = z.object({
  orderId: z.number().int().positive(),
});

/** Minimal projection of the order needed to price and authorise the intent. */
interface OrderSummary {
  id: number;
  orderNumber?: string;
  totalAmount?: number;
  currency?: string;
  paymentStatus?: string;
}

/** Backend response for intent creation; field names vary by serialiser. */
interface BackendIntentResponse {
  clientSecret?: string;
  client_secret?: string;
  paymentIntentId?: string;
  id?: string;
}

/**
 * Payment statuses for which creating a new intent is meaningless or unsafe.
 * Charging an already-paid or refunded order is a double-charge; the backend
 * is the final authority, but failing here avoids the round trip and gives the
 * shopper a clearer message.
 */
const NON_PAYABLE_STATUSES = new Set(['PAID', 'REFUNDED', 'PAYMENT_CANCELED', 'CANCELLED']);

// ============================================================
// 2. HANDLER
// ============================================================

export const POST = withRoute('payments/create-intent', async (req, { log }) => {
  const caller = await requireSession(req);

  // Payment-intent creation is throttled per user: each call may create a
  // Stripe object, so an unbounded loop is both a cost and a noise problem.
  await enforceRateLimit(
    `payments:create-intent:${caller.userId}`,
    'Too many payment attempts. Please wait a moment before retrying.'
  );

  const { orderId } = await readValidatedBody(req, createIntentSchema);

  // ---------- Authorisation: the order must exist AND belong to the caller ----------
  const order = await loadOwnedOrder(orderId, caller.accessToken);

  if (order.paymentStatus && NON_PAYABLE_STATUSES.has(order.paymentStatus.toUpperCase())) {
    throw ApiError.conflict(
      'This order can no longer be paid for. Please check its status in your orders.'
    );
  }

  // ---------- Pricing: derived, never accepted ----------
  const amount = order.totalAmount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    // A missing or nonsensical total is a data-integrity problem, not a user
    // error — surface it as a server fault so it is alerted on, and refuse to
    // guess a figure to charge.
    throw ApiError.upstream(
      'This order could not be priced for payment. Please contact support.',
      new Error(`Order ${orderId} has an unusable totalAmount: ${String(amount)}`)
    );
  }

  const currency = (order.currency ?? env.NEXT_PUBLIC_DEFAULT_CURRENCY).toLowerCase();

  log.info('Creating payment intent', {
    userId: caller.userId,
    orderId,
    // The authoritative amount is logged so a disputed charge can be traced
    // to the figure the server actually used.
    amount,
    currency,
  });

  // ---------- Create ----------
  let intent: BackendIntentResponse;
  try {
    const result = await serverBackendFetch<BackendIntentResponse>(
      API_ENDPOINTS.ORDERS.UPDATE_PAYMENT(orderId),
      caller.accessToken,
      {
        method: 'POST',
        body: {
          amount,
          currency,
          description: `Order ${order.orderNumber ?? orderId}`,
          /**
           * Idempotency key derived from the order, not from the request.
           * Stripe treats repeated calls with the same key as one operation,
           * so a double-click, a retried fetch, or a resumed checkout returns
           * the original intent instead of creating a second charge.
           */
          idempotencyKey: `order-${orderId}-intent`,
        },
      }
    );
    intent = result.data;
  } catch (error) {
    throw mapUpstreamError(error, 'Payment could not be set up. Please try again.');
  }

  const clientSecret = intent.clientSecret ?? intent.client_secret;
  if (!clientSecret) {
    throw ApiError.upstream(
      'Payment could not be set up. Please try again.',
      new Error(`Backend returned no client secret for order ${orderId}`)
    );
  }

  log.info('Payment intent created', { userId: caller.userId, orderId });

  return apiSuccess(
    {
      clientSecret,
      paymentIntentId: intent.paymentIntentId ?? intent.id,
      // Echoed so the client can render, and reconcile against, the exact
      // figure the server is charging rather than its own local computation.
      amount,
      currency,
    },
    { status: 201 }
  );
});

// ============================================================
// 3. HELPERS
// ============================================================

/**
 * Fetch an order **as the caller**, so the backend's own authorisation applies.
 *
 * Passing the caller's access token rather than a service credential is what
 * makes this an ownership check: the backend returns 403/404 for an order the
 * token does not own, and both are collapsed into a single 404 here so the
 * response cannot be used to probe which order ids exist.
 */
async function loadOwnedOrder(
  orderId: number,
  accessToken: string | undefined
): Promise<OrderSummary> {
  try {
    const { data } = await serverBackendFetch<OrderSummary | { data: OrderSummary }>(
      API_ENDPOINTS.ORDERS.DETAIL(String(orderId)),
      accessToken
    );

    // Some backend endpoints wrap payloads in an envelope; unwrap defensively.
    const order = (data as { data?: OrderSummary }).data ?? (data as OrderSummary);

    if (!order || typeof order.id !== 'number') {
      throw ApiError.notFound('Order not found.');
    }

    return order;
  } catch (error) {
    // `hideNotFound` collapses a 403 into a 404 so an order the caller does
    // not own is indistinguishable from one that does not exist — see the
    // module docblock.
    throw mapUpstreamError(error, 'Could not load this order. Please try again.', {
      hideNotFound: true,
    });
  }
}
