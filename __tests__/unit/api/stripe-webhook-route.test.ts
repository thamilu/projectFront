/**
 * @jest-environment node
 *
 * Contract tests for the Stripe webhook.
 *
 * [SECURITY] The original regression these tests were written for: the route
 * verified nothing. `getStripe()` (the client-side `@stripe/stripe-js`
 * instance) returns a Promise with no `.webhooks` namespace, so the old
 * `constructEvent()` always fell through to `JSON.parse(body)` — anyone who
 * found the endpoint could POST a fabricated `payment_intent.succeeded` with an
 * arbitrary orderId and have it marked PAID. Those assertions are preserved
 * below and remain the most important in the file.
 *
 * [BEHAVIOUR CHANGE] The final test now asserts the *opposite* of what it did
 * previously. The route used to swallow downstream failures and return 200,
 * with the comment "we don't want to reject the webhook" — which meant a
 * payment could succeed while the order update failed, Stripe would never retry
 * (it saw a 200), and no alert fired. Returning 5xx is the only way to ask
 * Stripe to redeliver, so that is now the required behaviour.
 */

import { NextRequest } from 'next/server';

// ---------- Stripe SDK ----------
const constructEventMock = jest.fn();
jest.mock('@/infrastructure/payments/stripe-server', () => ({
  getStripeServerClient: jest.fn(() => ({
    webhooks: { constructEvent: constructEventMock },
  })),
}));
import { getStripeServerClient } from '@/infrastructure/payments/stripe-server';

/**
 * The env mock must cover every key the module graph reads at import time —
 * `API_ENDPOINTS` resolves the API version eagerly — not just the keys this
 * route uses directly.
 */
jest.mock('@/env', () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    INTERNAL_API_SECRET: 'internal-secret-value-32-chars-ok',
    NEXT_PUBLIC_API_URL: 'http://localhost:8080',
    NEXT_PUBLIC_API_VERSION: 'v1',
    SPRING_BOOT_API_URL: 'http://localhost:8082',
    INTERNAL_API_URL: 'http://localhost:8082',
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    NODE_ENV: 'test',
  },
}));

// ---------- Backend ----------
const backendFetchMock = jest.fn();
jest.mock('@/core/client/server-fetch', () => ({
  serverBackendFetch: (...args: unknown[]) => backendFetchMock(...args),
}));

// ---------- Idempotency ----------
// Defaults to "claimed" so each test exercises the processing path; individual
// tests override it to assert duplicate and degraded behaviour.
const releaseMock = jest.fn().mockResolvedValue(undefined);
const claimEventMock = jest.fn();
jest.mock('@/shared/api/idempotency', () => ({
  claimEvent: (...args: unknown[]) => claimEventMock(...args),
}));

// ---------- Logging ----------
const logMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('@/core/telemetry/logger', () => ({
  getRequestLogger: jest.fn(() => logMock),
  logger: logMock,
}));

import { POST } from '@/app/api/webhooks/stripe/route';

// ============================================================
// Fixtures
// ============================================================

function makeRequest(body: string, signature: string | null = 'valid-signature'): NextRequest {
  const headers = new Headers();
  if (signature !== null) headers.set('stripe-signature', signature);
  return new NextRequest(
    new Request('http://localhost:3000/api/webhooks/stripe', { method: 'POST', body, headers })
  );
}

/** A signed Stripe event, shaped as the SDK would return it. */
function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_test_1',
    type: 'payment_intent.succeeded',
    created: 1_700_000_000,
    data: { object: { id: 'pi_test_1', amount: 4999, metadata: { orderId: '42' } } },
    ...overrides,
  };
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    backendFetchMock.mockResolvedValue({ data: {} });
    claimEventMock.mockResolvedValue({ outcome: 'claimed', release: releaseMock });
  });

  // ============================================================
  // Signature verification
  // ============================================================

  describe('signature verification', () => {
    it('rejects a request with no stripe-signature header without touching order state', async () => {
      const res = await POST(makeRequest('{"type":"payment_intent.succeeded"}', null));

      expect(res.status).toBe(400);
      expect(constructEventMock).not.toHaveBeenCalled();
      expect(backendFetchMock).not.toHaveBeenCalled();
    });

    it('rejects a forged payload and never marks any order PAID', async () => {
      constructEventMock.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload');
      });

      const forged = JSON.stringify({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_fake', amount: 999999, metadata: { orderId: '1' } } },
      });

      const res = await POST(makeRequest(forged, 'attacker-supplied-signature'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.errorCode).toBe('ValidationFailed');
      // The critical assertion: no order was touched by the unverified payload.
      expect(backendFetchMock).not.toHaveBeenCalled();
      // Nor was an idempotency claim taken, which would suppress a later
      // genuine delivery of an event with the same id.
      expect(claimEventMock).not.toHaveBeenCalled();
    });

    it('refuses to process anything when Stripe is not configured', async () => {
      (getStripeServerClient as jest.Mock).mockReturnValueOnce(null);

      const res = await POST(makeRequest('{"type":"payment_intent.succeeded"}'));

      expect(res.status).toBe(400);
      expect(backendFetchMock).not.toHaveBeenCalled();
    });

    it('verifies against the configured webhook secret and the exact raw body', async () => {
      const event = makeEvent();
      const raw = JSON.stringify(event);
      constructEventMock.mockReturnValue(event);

      await POST(makeRequest(raw, 'genuinely-valid-signature'));

      expect(constructEventMock).toHaveBeenCalledWith(
        raw,
        'genuinely-valid-signature',
        'whsec_test_secret'
      );
    });
  });

  // ============================================================
  // Event application
  // ============================================================

  describe('event application', () => {
    it('marks the order PAID after verification succeeds', async () => {
      const event = makeEvent();
      constructEventMock.mockReturnValue(event);

      const res = await POST(makeRequest(JSON.stringify(event)));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.received).toBe(true);

      const [endpoint, token, options] = backendFetchMock.mock.calls[0];
      expect(endpoint).toContain('/orders/42/payment-status');
      // Authenticated with the service credential, not a user session.
      expect(token).toBe('internal-secret-value-32-chars-ok');
      expect(options).toMatchObject({
        method: 'PATCH',
        body: expect.objectContaining({
          status: 'PAID',
          paymentIntentId: 'pi_test_1',
          stripeEventId: 'evt_test_1',
        }),
      });
    });

    it.each([
      ['payment_intent.payment_failed', 'PAYMENT_FAILED'],
      ['payment_intent.canceled', 'PAYMENT_CANCELED'],
      ['charge.refunded', 'REFUNDED'],
      ['charge.dispute.created', 'DISPUTED'],
    ])('maps %s to %s', async (type, expectedStatus) => {
      constructEventMock.mockReturnValue(makeEvent({ type }));

      const res = await POST(makeRequest('{}'));

      expect(res.status).toBe(200);
      expect(backendFetchMock.mock.calls[0][2].body).toMatchObject({ status: expectedStatus });
    });

    it('converts refunded minor units to major units exactly once', async () => {
      constructEventMock.mockReturnValue(
        makeEvent({
          type: 'charge.refunded',
          data: { object: { id: 'ch_1', amount_refunded: 4999, metadata: { orderId: '42' } } },
        })
      );

      await POST(makeRequest('{}'));

      expect(backendFetchMock.mock.calls[0][2].body.refundAmount).toBe(49.99);
    });

    it('acknowledges an unhandled event type without calling the backend', async () => {
      constructEventMock.mockReturnValue(makeEvent({ type: 'customer.created' }));

      const res = await POST(makeRequest('{}'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.handled).toBe(false);
      expect(backendFetchMock).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Idempotency
  // ============================================================

  describe('idempotency', () => {
    it('skips an event already processed, without re-applying it', async () => {
      constructEventMock.mockReturnValue(makeEvent());
      claimEventMock.mockResolvedValue({ outcome: 'duplicate' });

      const res = await POST(makeRequest('{}'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.duplicate).toBe(true);
      // The point of the whole mechanism: no second application.
      expect(backendFetchMock).not.toHaveBeenCalled();
    });

    it('processes anyway when the idempotency store is unavailable', async () => {
      // Dropping payment events during a cache outage is strictly worse than a
      // rare double-apply, so the route degrades to at-least-once.
      constructEventMock.mockReturnValue(makeEvent());
      claimEventMock.mockResolvedValue({ outcome: 'unavailable' });

      const res = await POST(makeRequest('{}'));

      expect(res.status).toBe(200);
      expect(backendFetchMock).toHaveBeenCalled();
    });

    it('claims per event id, namespaced to stripe', async () => {
      constructEventMock.mockReturnValue(makeEvent({ id: 'evt_unique_9' }));

      await POST(makeRequest('{}'));

      expect(claimEventMock).toHaveBeenCalledWith('stripe', 'evt_unique_9');
    });
  });

  // ============================================================
  // Failure handling
  // ============================================================

  describe('failure handling', () => {
    it('returns 5xx and releases the claim when the order update fails, so Stripe retries', async () => {
      constructEventMock.mockReturnValue(makeEvent());
      backendFetchMock.mockRejectedValue(new Error('backend unavailable'));

      const res = await POST(makeRequest('{}'));

      // 5xx is the only signal that asks Stripe to redeliver. Returning 200
      // here — the previous behaviour — stranded the event permanently.
      expect(res.status).toBeGreaterThanOrEqual(500);
      // Without releasing, the claim would suppress every subsequent retry.
      expect(releaseMock).toHaveBeenCalled();
      expect(logMock.error).toHaveBeenCalled();
    });

    it('dead-letters an event whose metadata carries no orderId, rather than retrying forever', async () => {
      constructEventMock.mockReturnValue(
        makeEvent({ data: { object: { id: 'pi_1', amount: 100, metadata: {} } } })
      );

      const res = await POST(makeRequest('{}'));
      const body = await res.json();

      // Acknowledged so Stripe stops retrying something that can never
      // succeed, but logged at error so it surfaces for reconciliation.
      expect(res.status).toBe(200);
      expect(body.deadLettered).toBe(true);
      expect(backendFetchMock).not.toHaveBeenCalled();
      expect(logMock.error).toHaveBeenCalledWith(
        expect.stringContaining('cannot be processed'),
        expect.objectContaining({ deadLetter: true })
      );
    });

    it('rejects a non-numeric orderId before it can reach a backend URL', async () => {
      // Guards the path-traversal / request-forgery vector that
      // `/orders/${metadata.orderId}/payment-status` would otherwise expose.
      constructEventMock.mockReturnValue(
        makeEvent({
          data: { object: { id: 'pi_1', amount: 100, metadata: { orderId: '../../admin' } } },
        })
      );

      const res = await POST(makeRequest('{}'));

      expect(res.status).toBe(200);
      expect((await res.json()).deadLettered).toBe(true);
      expect(backendFetchMock).not.toHaveBeenCalled();
    });
  });
});
