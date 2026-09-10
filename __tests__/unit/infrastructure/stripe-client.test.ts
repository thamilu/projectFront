/**
 * @jest-environment jsdom
 */

const loadStripeMock = jest.fn();
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: (...args: unknown[]) => loadStripeMock(...args),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { logger } from '@/core/telemetry/logger';

describe('getStripe', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('always returns a Promise, even when the publishable key is missing', async () => {
    jest.doMock('@/env', () => ({ env: { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined } }));
    const { getStripe } = await import('@/infrastructure/payments/stripe-client');

    const result = getStripe();
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      '[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing'
    );
    expect(loadStripeMock).not.toHaveBeenCalled();
  });

  it('initializes loadStripe with the publishable key and caches the promise', async () => {
    jest.doMock('@/env', () => ({ env: { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123' } }));
    const fakeClient = { key: 'fake-stripe-client' };
    loadStripeMock.mockReturnValue(Promise.resolve(fakeClient));
    const { getStripe } = await import('@/infrastructure/payments/stripe-client');

    const first = getStripe();
    const second = getStripe();

    expect(loadStripeMock).toHaveBeenCalledTimes(1);
    expect(loadStripeMock).toHaveBeenCalledWith('pk_test_123');
    expect(first).toBe(second);
    await expect(first).resolves.toBe(fakeClient);
  });
});

describe('formatAmountForStripe', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('converts a standard (two-decimal) currency amount into minor units', async () => {
    jest.doMock('@/env', () => ({ env: { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined } }));
    const { formatAmountForStripe } = await import('@/infrastructure/payments/stripe-client');
    expect(formatAmountForStripe(19.99, 'USD')).toBe(1999);
  });

  it('leaves a zero-decimal currency amount unconverted', async () => {
    jest.doMock('@/env', () => ({ env: { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined } }));
    const { formatAmountForStripe } = await import('@/infrastructure/payments/stripe-client');
    expect(formatAmountForStripe(500, 'JPY')).toBe(500);
  });
});
