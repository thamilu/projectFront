/**
 * Contract tests for the payment-intent client.
 *
 * The most important assertion in this file is a negative one: the request
 * body must contain **only** `orderId`. An earlier contract accepted an
 * `amount` from the browser and the route forwarded it unchanged, which let a
 * shopper pay an arbitrary sum for a real order. The "sends only orderId" test
 * exists to fail loudly if that field is ever reintroduced here.
 */

import {
  createPaymentIntent,
  PaymentIntentError,
} from '@/features/checkout/api/payment-api';

const originalFetch = global.fetch;

/** Build a minimal `Response` stub for the shapes this client handles. */
function mockFetch(response: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}): jest.Mock {
  const fn = jest.fn().mockResolvedValue(response);
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

/** Await a promise expected to reject, returning the typed error. */
async function captureRejection(promise: Promise<unknown>): Promise<PaymentIntentError> {
  try {
    await promise;
  } catch (error) {
    return error as PaymentIntentError;
  }
  throw new Error('Expected the promise to reject, but it resolved.');
}

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('createPaymentIntent', () => {
  it('posts only the order id — never a client-supplied amount', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 201,
      json: async () => ({
        clientSecret: 'pi_123_secret_abc',
        paymentIntentId: 'pi_123',
        amount: 99.99,
        currency: 'inr',
      }),
    });

    await createPaymentIntent({ orderId: 42 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/payments/create-intent');
    expect(init.method).toBe('POST');

    // Exact-equality, not `objectContaining`: the point is that no other
    // field is present.
    expect(JSON.parse(init.body as string)).toEqual({ orderId: 42 });
  });

  it('sends the session cookie so the route can identify the caller', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 201,
      json: async () => ({ clientSecret: 'cs', amount: 10, currency: 'inr' }),
    });

    await createPaymentIntent({ orderId: 1 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('same-origin');
  });

  it('returns the server-priced amount and currency alongside the client secret', async () => {
    mockFetch({
      ok: true,
      status: 201,
      json: async () => ({
        clientSecret: 'pi_secret',
        paymentIntentId: 'pi_1',
        amount: 1499.5,
        currency: 'inr',
      }),
    });

    const result = await createPaymentIntent({ orderId: 7 });

    expect(result).toEqual({
      clientSecret: 'pi_secret',
      paymentIntentId: 'pi_1',
      amount: 1499.5,
      currency: 'inr',
    });
  });

  it('surfaces the server message and stable error code on a failure envelope', async () => {
    mockFetch({
      ok: false,
      status: 409,
      json: async () => ({
        status: 409,
        errorCode: 'Conflict',
        message: 'This order can no longer be paid for.',
      }),
    });

    await expect(createPaymentIntent({ orderId: 1 })).rejects.toMatchObject({
      name: 'PaymentIntentError',
      message: 'This order can no longer be paid for.',
      errorCode: 'Conflict',
      status: 409,
    });
  });

  /**
   * `isRetryable` is what the checkout UI branches on to decide whether to
   * offer a retry button. Offering one for "this order is already paid" would
   * invite the shopper to try something that can never succeed.
   */
  it.each([
    { status: 502, errorCode: 'UpstreamFailure', retryable: true },
    { status: 429, errorCode: 'RateLimitExceeded', retryable: true },
    { status: 404, errorCode: 'NotFound', retryable: false },
    { status: 409, errorCode: 'Conflict', retryable: false },
  ])('classifies $status as retryable=$retryable', async ({ status, errorCode, retryable }) => {
    mockFetch({ ok: false, status, json: async () => ({ errorCode, message: 'failed' }) });

    const error = await captureRejection(createPaymentIntent({ orderId: 1 }));

    expect(error).toBeInstanceOf(PaymentIntentError);
    expect(error.isRetryable).toBe(retryable);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    mockFetch({
      ok: false,
      status: 400,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(createPaymentIntent({ orderId: 1 })).rejects.toThrow(
      'Payment could not be set up (400).'
    );
  });

  it('rejects a 2xx response that carries no client secret', async () => {
    // A malformed success is more dangerous than an explicit failure: the
    // checkout UI would otherwise advance to a Stripe form it cannot mount.
    mockFetch({ ok: true, status: 201, json: async () => ({ paymentIntentId: 'pi_1' }) });

    await expect(createPaymentIntent({ orderId: 1 })).rejects.toMatchObject({
      errorCode: 'MalformedResponse',
    });
  });
});
