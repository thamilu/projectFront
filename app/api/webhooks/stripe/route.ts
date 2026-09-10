/**
 * POST /api/webhooks/stripe
 *
 * Applies Stripe payment lifecycle events to the corresponding order.
 *
 * Three properties make this handler safe under Stripe's *at-least-once*
 * delivery contract. Each replaces a specific defect in the previous version:
 *
 * 1. **Idempotent.** Every `event.id` is claimed atomically before processing
 *    (see `shared/api/idempotency`). Previously `event.id` was logged but never
 *    deduplicated, so a retried `charge.refunded` could apply a second refund.
 *
 * 2. **Failures are retried, not swallowed.** Every handler previously caught
 *    its own errors, logged them, and returned 200 with the comment *"Don't
 *    throw - we don't want to reject the webhook"*. The effect was that a
 *    payment could succeed while the order update failed, Stripe would never
 *    retry because it saw a 200, and no alert fired — money taken, order never
 *    marked paid. A processing failure now releases the idempotency claim and
 *    returns 5xx so Stripe retries on its own backoff schedule.
 *
 * 3. **The order id is validated.** With `metadata.orderId` absent the previous
 *    code issued `PATCH /orders/undefined/payment-status`. A missing or
 *    malformed id is now an explicit, alertable condition.
 *
 * [SECURITY] Signature verification is mandatory and has no fallback path. Only
 * `getStripeServerClient()` (the real `stripe` SDK, secret key) can verify a
 * Stripe signature — the `@stripe/stripe-js` browser client used elsewhere in
 * this codebase cannot. An earlier revision fell back to `JSON.parse(body)`
 * whenever the client lacked a `.webhooks` namespace, which was always, so
 * verification never actually ran: anyone who found this endpoint could POST a
 * fabricated `payment_intent.succeeded` and have an arbitrary order marked PAID.
 */

import type { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripeServerClient } from '@/infrastructure/payments/stripe-server';
import { env } from '@/env';
import { getRequestLogger } from '@/core/telemetry/logger';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { claimEvent } from '@/shared/api/idempotency';
// Imported from the specific modules rather than the `@/shared/api` barrel:
// the barrel re-exports the session guards, which pull in `next-auth/jwt`.
// A webhook authenticates a signature, not a user session, so dragging the
// session-decoding module graph into this route would be both wasted bundle
// weight and a misleading dependency.
import { apiSuccess, apiError } from '@/shared/api/response';
import { ApiError } from '@/shared/api/errors';

/** Signature verification needs the raw body and Node crypto — not Edge. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Guards against an oversized body being buffered before verification. */
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB — well above any real Stripe event

// ============================================================
// 1. DOMAIN MAPPING
// ============================================================

/** Payment status values the backend accepts on an order. */
type OrderPaymentStatus = 'PAID' | 'PAYMENT_FAILED' | 'PAYMENT_CANCELED' | 'REFUNDED' | 'DISPUTED';

/** Fields patched onto an order. Assembled per event type below. */
interface PaymentStatusPatch {
  status: OrderPaymentStatus;
  paymentIntentId?: string;
  paidAt?: string;
  failureReason?: string;
  refundedAt?: string;
  refundAmount?: number;
  disputeReason?: string;
  /** Echoed so the backend can dedupe independently of this route's store. */
  stripeEventId: string;
}

/**
 * Stripe reports monetary values as integer minor units (paise, cents).
 * Converting at exactly one place stops the `/100` from being repeated — or
 * forgotten — per handler, which is how currency bugs get introduced.
 */
function toMajorUnits(minorUnits: number | null | undefined): number {
  return typeof minorUnits === 'number' && Number.isFinite(minorUnits) ? minorUnits / 100 : 0;
}

/**
 * Extract and validate the order id carried in event metadata.
 *
 * Throws rather than defaulting: an event whose order cannot be identified is
 * unprocessable, and silently continuing is what produced requests to
 * `/orders/undefined/payment-status`.
 */
function requireOrderId(metadata: Stripe.Metadata | null | undefined): string {
  const raw = metadata?.orderId;
  if (!raw) {
    throw new UnprocessableEventError('Event metadata carries no orderId');
  }

  // Order ids are numeric (OrderDTO.id). Validating before the value reaches a
  // URL closes a path-traversal / request-forgery vector.
  if (!/^\d+$/.test(raw)) {
    throw new UnprocessableEventError(`Event metadata carries a non-numeric orderId: ${raw}`);
  }

  return raw;
}

/**
 * A well-formed, correctly signed event this handler cannot act on — a missing
 * or malformed order id, say.
 *
 * Distinguished from a transient failure because retrying will never help: the
 * event is acknowledged with 200 (so Stripe stops) and logged at `error` so it
 * is alertable and can be reconciled by hand. Returning 5xx instead would
 * produce days of pointless retries for an event that can never succeed.
 */
class UnprocessableEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnprocessableEventError';
  }
}

// ============================================================
// 2. EVENT HANDLERS
// ============================================================

/**
 * Build the patch for a supported event, or return `null` for an event type
 * this application does not act on.
 *
 * Returning data rather than performing I/O keeps every branch pure and
 * unit-testable, and confines the network call to one place below.
 */
function buildPatch(event: Stripe.Event): PaymentStatusPatch | null {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        status: 'PAID',
        paymentIntentId: intent.id,
        paidAt: new Date(event.created * 1000).toISOString(),
        stripeEventId: event.id,
      };
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        status: 'PAYMENT_FAILED',
        paymentIntentId: intent.id,
        failureReason: intent.last_payment_error?.message ?? 'Payment failed',
        stripeEventId: event.id,
      };
    }

    case 'payment_intent.canceled': {
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        status: 'PAYMENT_CANCELED',
        paymentIntentId: intent.id,
        stripeEventId: event.id,
      };
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      return {
        status: 'REFUNDED',
        refundedAt: new Date(event.created * 1000).toISOString(),
        refundAmount: toMajorUnits(charge.amount_refunded),
        stripeEventId: event.id,
      };
    }

    /**
     * Disputes were previously unhandled entirely. A chargeback freezes funds
     * and carries a response deadline, so the order must be flagged the moment
     * it is raised rather than discovered later in the Stripe dashboard.
     */
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute;
      return {
        status: 'DISPUTED',
        disputeReason: dispute.reason ?? 'unknown',
        stripeEventId: event.id,
      };
    }

    default:
      return null;
  }
}

/**
 * Read the order id from whichever object this event carries.
 *
 * `Charge` and `PaymentIntent` both expose `metadata`, but they are distinct
 * types, so the narrowing happens here rather than being repeated per handler.
 */
function extractOrderId(event: Stripe.Event): string {
  const object = event.data.object as { metadata?: Stripe.Metadata | null };
  return requireOrderId(object.metadata);
}

// ============================================================
// 3. ROUTE
// ============================================================

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const path = request.nextUrl.pathname;
  const log = getRequestLogger(requestId, { route: 'webhooks/stripe' });

  // ---------- Verify ----------
  let event: Stripe.Event;
  try {
    event = await verifyRequest(request);
  } catch (error) {
    // A verification failure is either a misconfiguration or a forgery
    // attempt. Both warrant a log line; neither warrants detail in the reply.
    log.error('[StripeWebhook] Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError(ApiError.validation('Invalid webhook signature.'), { requestId, path });
  }

  const eventLog = getRequestLogger(requestId, {
    route: 'webhooks/stripe',
    eventId: event.id,
    eventType: event.type,
  });

  // ---------- Claim ----------
  const claim = await claimEvent('stripe', event.id);
  if (claim.outcome === 'duplicate') {
    // Acknowledged, not reprocessed. This is the expected path for a Stripe
    // retry following a delivery it could not record.
    eventLog.info('[StripeWebhook] Duplicate event ignored');
    return acknowledge(requestId, { duplicate: true });
  }

  // ---------- Apply ----------
  try {
    const patch = buildPatch(event);

    if (!patch) {
      eventLog.info('[StripeWebhook] Event type not handled');
      return acknowledge(requestId, { handled: false });
    }

    const orderId = extractOrderId(event);

    eventLog.info('[StripeWebhook] Applying payment status', {
      orderId,
      status: patch.status,
    });

    await applyPaymentStatus(orderId, patch);

    eventLog.info('[StripeWebhook] Payment status applied', { orderId, status: patch.status });
    return acknowledge(requestId, { handled: true });
  } catch (error) {
    // ---------- Permanently unprocessable ----------
    if (error instanceof UnprocessableEventError) {
      // Logged at `error` so monitoring surfaces it for manual reconciliation,
      // but acknowledged so Stripe stops retrying something that can never
      // succeed. This is the dead-letter signal.
      eventLog.error('[StripeWebhook] Event cannot be processed and will not be retried', {
        reason: error.message,
        deadLetter: true,
      });
      return acknowledge(requestId, { handled: false, deadLettered: true });
    }

    // ---------- Transient ----------
    // Release the claim so Stripe's retry is allowed to reprocess. Without
    // this the claim would suppress every subsequent attempt and strand the
    // event — the failure mode the idempotency guard must not introduce.
    if (claim.outcome === 'claimed') {
      await claim.release();
    }

    eventLog.error('[StripeWebhook] Processing failed; returning 5xx so Stripe retries', {
      error: error instanceof Error ? error.message : String(error),
    });

    // 5xx is deliberate: it is the only way to ask Stripe to deliver again.
    return apiError(
      ApiError.upstream('Webhook processing failed. The event will be retried.'),
      { requestId, path }
    );
  }
}

// ============================================================
// 4. HELPERS
// ============================================================

/** Read the raw body and cryptographically verify it against the signature. */
async function verifyRequest(request: NextRequest): Promise<Stripe.Event> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_PAYLOAD_BYTES) {
    throw new Error('Payload exceeds the maximum accepted size');
  }

  const stripe = getStripeServerClient();
  if (!stripe) {
    throw new Error('Stripe is not configured on this server');
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  // Throws on any mismatch, replayed timestamp, or malformed signature.
  return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}

/**
 * Patch the order's payment status via the backend.
 *
 * Authenticated with `INTERNAL_API_SECRET`: this call is made on Stripe's
 * behalf, not a user's, so there is no session token to forward. A missing
 * secret is raised explicitly rather than sending `Bearer undefined`, which is
 * what the previous `process.env` lookup did when the variable was unset.
 */
async function applyPaymentStatus(orderId: string, patch: PaymentStatusPatch): Promise<void> {
  // Read from the validated env object, not a raw process.env lookup —
  // see the INTERNAL_API_SECRET declaration in env.ts.
  const internalSecret = env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    // A transient-shaped error on purpose: it is fixable by configuration, so
    // Stripe should keep retrying while an operator repairs the deployment,
    // rather than the event being dead-lettered.
    throw new Error('INTERNAL_API_SECRET is not configured; cannot update the order');
  }

  await serverBackendFetch(API_ENDPOINTS.ORDERS.UPDATE_PAYMENT(orderId), internalSecret, {
    method: 'PATCH',
    body: patch,
  });
}

/** 200 response telling Stripe the event was received. */
function acknowledge(requestId: string, detail: Record<string, boolean>) {
  return apiSuccess({ received: true, ...detail }, { requestId });
}
