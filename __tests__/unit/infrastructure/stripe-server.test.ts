/**
 * @jest-environment node
 */

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const StripeConstructorMock = jest.fn();
jest.mock('stripe', () => ({
  __esModule: true,
  default: class {
    constructor(...args: unknown[]) {
      StripeConstructorMock(...args);
    }
  },
}));

import { logger } from '@/core/telemetry/logger';

describe('getStripeServerClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns null and warns when STRIPE_SECRET_KEY is not configured', async () => {
    jest.doMock('@/env', () => ({ env: { STRIPE_SECRET_KEY: undefined } }));
    const { getStripeServerClient } = await import('@/infrastructure/payments/stripe-server');

    const result = getStripeServerClient();

    expect(result).toBeNull();
    expect(StripeConstructorMock).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      '[Stripe] STRIPE_SECRET_KEY is not configured — Stripe features are disabled'
    );
  });

  it('constructs a real Stripe client with the secret key and caches it', async () => {
    jest.doMock('@/env', () => ({ env: { STRIPE_SECRET_KEY: 'sk_test_123' } }));
    const { getStripeServerClient } = await import('@/infrastructure/payments/stripe-server');

    const first = getStripeServerClient();
    const second = getStripeServerClient();

    expect(StripeConstructorMock).toHaveBeenCalledTimes(1);
    expect(StripeConstructorMock).toHaveBeenCalledWith('sk_test_123');
    expect(first).toBe(second);
    expect(first).not.toBeNull();
  });

  it('throws when imported in a browser-like (window-defined) context', async () => {
    (globalThis as { window?: unknown }).window = {};
    try {
      jest.doMock('@/env', () => ({ env: { STRIPE_SECRET_KEY: 'sk_test_123' } }));
      await expect(import('@/infrastructure/payments/stripe-server')).rejects.toThrow(
        /must only run on the server/
      );
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});
