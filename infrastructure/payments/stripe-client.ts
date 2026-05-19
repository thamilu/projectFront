/**
 * Stripe Client-side Integration
 * 
 * [HARDEN] This client is now for client-side use ONLY.
 * All server-side operations (payment intents, refunds, etc.) must be 
 * handled by the Spring Boot backend.
 */

import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';
import { env } from '@/env';

let stripePromise: Promise<StripeClient | null>;

/**
 * Get or initialize the client-side Stripe instance
 * Uses the PUBLIC publishable key only.
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn('[Stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Types for payment intent responses from our backend
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
