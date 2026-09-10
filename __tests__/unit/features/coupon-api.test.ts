/**
 * Contract tests for the coupon validation client.
 *
 * The route it calls is now an authenticated pass-through to the backend
 * coupon service, and returns the shared error envelope
 * (`{ status, errorCode, message, … }`) rather than the previous ad-hoc
 * `{ success: false, error }`. These tests pin the client to that envelope,
 * including the `errorCode` the cart UI branches on to distinguish "wrong code"
 * from "service unavailable".
 */

import { validateCoupon, CouponValidationError } from '@/features/cart/api/coupon-api';

const originalFetch = global.fetch;

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
async function captureRejection(promise: Promise<unknown>): Promise<CouponValidationError> {
  try {
    await promise;
  } catch (error) {
    return error as CouponValidationError;
  }
  throw new Error('Expected the promise to reject, but it resolved.');
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe('validateCoupon', () => {
  it('posts the coupon code and cart total to the secure validation route', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          couponCode: 'SAVE20',
          discountAmount: 100,
          finalTotal: 900,
          message: 'Coupon applied! You saved ₹100',
        },
      }),
    });

    const result = await validateCoupon('save20', 1000);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/secure/validate-coupon');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ couponCode: 'save20', cartTotal: 1000 });

    // The route normalises the code server-side, so the response — not the
    // input — is what the UI displays.
    expect(result).toEqual({
      couponCode: 'SAVE20',
      discountAmount: 100,
      finalTotal: 900,
      message: 'Coupon applied! You saved ₹100',
    });
  });

  it('sends the session cookie, since the route is authenticated', async () => {
    const fetchMock = mockFetch({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { couponCode: 'X', discountAmount: 0, finalTotal: 100, message: 'ok' },
      }),
    });

    await validateCoupon('X', 100);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('same-origin');
  });

  it('surfaces the server reason verbatim when a coupon is rejected', async () => {
    // The shopper needs the specific reason — "minimum purchase not met" is
    // actionable in a way that "invalid coupon" is not.
    mockFetch({
      ok: false,
      status: 400,
      json: async () => ({
        status: 400,
        errorCode: 'ValidationFailed',
        message: 'Minimum purchase of ₹500 required',
      }),
    });

    const error = await captureRejection(validateCoupon('SAVE20', 100));

    expect(error).toBeInstanceOf(CouponValidationError);
    expect(error.message).toBe('Minimum purchase of ₹500 required');
    expect(error.errorCode).toBe('ValidationFailed');
    // A 4xx is something the shopper can fix by entering a different code.
    expect(error.isUserCorrectable).toBe(true);
  });

  it('marks a 5xx as not user-correctable so the UI keeps any applied code', async () => {
    mockFetch({
      ok: false,
      status: 502,
      json: async () => ({
        status: 502,
        errorCode: 'UpstreamFailure',
        message: 'Promo codes are temporarily unavailable. Please try again.',
      }),
    });

    const error = await captureRejection(validateCoupon('SAVE20', 1000));

    expect(error.isUserCorrectable).toBe(false);
    expect(error.errorCode).toBe('UpstreamFailure');
  });

  it('reports a throttled attempt with its stable code', async () => {
    // Coupon codes are a brute-force target, so the route throttles per user;
    // the UI needs to tell the shopper to wait rather than that the code is bad.
    mockFetch({
      ok: false,
      status: 429,
      json: async () => ({
        status: 429,
        errorCode: 'RateLimitExceeded',
        message: 'Too many promo code attempts. Please wait a moment before trying again.',
      }),
    });

    const error = await captureRejection(validateCoupon('SAVE20', 1000));

    expect(error.errorCode).toBe('RateLimitExceeded');
    expect(error.status).toBe(429);
  });

  it('falls back to a generic message when the error response has no body', async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(validateCoupon('SAVE20', 100)).rejects.toThrow(
      'Could not validate this promo code (500).'
    );
  });

  it('rejects a 2xx response whose envelope is malformed', async () => {
    // Silently returning `undefined` here would render an empty discount row
    // in the cart rather than an error the shopper can act on.
    mockFetch({ ok: true, status: 200, json: async () => ({ success: true }) });

    const error = await captureRejection(validateCoupon('SAVE20', 100));

    expect(error.errorCode).toBe('MalformedResponse');
  });
});
