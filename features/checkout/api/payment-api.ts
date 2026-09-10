/**
 * Payment-intent client.
 *
 * Calls this app's own Next.js route (`app/api/payments/create-intent`) rather
 * than the Spring Boot backend directly: that route holds the Stripe secret
 * server-side, asserts that the caller owns the order, and derives the payable
 * amount from stored order data.
 *
 * [SECURITY] The request carries **only** an `orderId`. It deliberately cannot
 * express an amount. An earlier contract accepted `amount`, `currency` and
 * `description` from the browser and the route forwarded them unchanged, which
 * allowed a shopper to pay an arbitrary sum for a real order. If you find
 * yourself wanting to add an amount field here, the correct change is on the
 * server: price it from the order.
 *
 * @module features/checkout/api/payment-api
 */

import type { ApiErrorBody } from '@/shared/api/response';

/** The only thing the client is trusted to name: which order to pay for. */
export interface CreatePaymentIntentRequest {
  orderId: number;
}

/**
 * Server-priced intent.
 *
 * `amount` and `currency` are echoed back so the UI can display — and
 * reconcile against — the exact figure being charged, instead of showing a
 * locally computed total that could silently diverge from it.
 */
export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId?: string;
  amount: number;
  currency: string;
}

/** Error preserving the route's stable `errorCode` for branching. */
export class PaymentIntentError extends Error {
  readonly errorCode: string;
  readonly status: number;

  constructor(message: string, errorCode: string, status: number) {
    super(message);
    this.name = 'PaymentIntentError';
    this.errorCode = errorCode;
    this.status = status;
  }

  /**
   * True when retrying the same request could plausibly succeed — a transient
   * upstream failure or a throttle. A 4xx such as "this order is already paid"
   * will never succeed on retry, so the checkout UI must not offer one.
   */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

/**
 * Create, or return the existing, payment intent for an order.
 *
 * The server derives an idempotency key from the order id, so repeated calls
 * for the same order return the original intent rather than creating a second
 * charge. Callers may therefore retry safely.
 *
 * @throws {PaymentIntentError}
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest,
  signal?: AbortSignal
): Promise<CreatePaymentIntentResponse> {
  const res = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    credentials: 'same-origin',
    signal,
  });

  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error = body as Partial<ApiErrorBody> | null;
    throw new PaymentIntentError(
      error?.message ?? `Payment could not be set up (${res.status}).`,
      error?.errorCode ?? 'UnknownError',
      res.status
    );
  }

  const payload = body as Partial<CreatePaymentIntentResponse> | null;

  if (!payload?.clientSecret) {
    throw new PaymentIntentError(
      'Payment could not be set up. Please try again.',
      'MalformedResponse',
      res.status
    );
  }

  return payload as CreatePaymentIntentResponse;
}
