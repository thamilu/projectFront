/**
 * Stripe Client-side Integration
 *
 * [HARDEN] This client is now for client-side use ONLY.
 * All server-side operations (payment intents, refunds, etc.) must be
 * handled by the Spring Boot backend.
 */

import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';
import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';

let stripePromise: Promise<StripeClient | null> | null = null;

/**
 * Get or initialize the client-side Stripe instance.
 * Uses the PUBLIC publishable key only — never import this on the server
 * for anything that needs to verify a webhook or otherwise act with
 * elevated privilege; see infrastructure/payments/stripe-server.ts for that.
 *
 * Always returns a Promise (never a bare value) so every call site can
 * `await getStripe()` uniformly, including the not-configured case.
 */
export const getStripe = (): Promise<StripeClient | null> => {
  if (!stripePromise) {
    const key = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      logger.warn('[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/**
 * Response shape of POST /api/payments/create-intent (this route exists and
 * works — app/api/payments/create-intent/route.ts). Currently unconsumed:
 * no checkout UI calls that route or renders Stripe Elements yet, so this
 * type has no import sites today. Left in place (not dead code to delete)
 * as the documented contract for whenever that checkout integration is
 * built — see the "Stripe checkout integration is incomplete" finding.
 */
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Utility to format currency for Stripe
 */
export const formatAmountForStripe = (amount: number, currency: string) => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
};
