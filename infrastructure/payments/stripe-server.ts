/**
 * Stripe Server-side Integration
 *
 * Server-only: constructs a real `stripe` (npm) SDK client using the secret
 * key, distinct from stripe-client.ts's browser `@stripe/stripe-js` client
 * (publishable key only). The two are never interchangeable — a browser
 * Stripe.js instance has no `.webhooks` namespace and cannot verify webhook
 * signatures, which is exactly the mistake this file exists to prevent
 * (see app/api/webhooks/stripe/route.ts, the only real consumer).
 */

import Stripe from 'stripe';
import { env } from '@/env';
import { logger } from '@/core/telemetry/logger';

if (typeof window !== 'undefined') {
  throw new Error(
    '[SECURITY] Stripe server client must only run on the server. ' +
      'Do not import infrastructure/payments/stripe-server in client components.'
  );
}

let stripeServerClient: Stripe | null | undefined; // undefined = not attempted yet

/**
 * Get or initialize the server-side Stripe client.
 * Returns null (never throws) when STRIPE_SECRET_KEY isn't configured —
 * Stripe payments are an opt-in feature, so callers must handle the
 * unconfigured case explicitly rather than assume it's always available.
 */
export function getStripeServerClient(): Stripe | null {
  if (stripeServerClient !== undefined) return stripeServerClient;

  if (!env.STRIPE_SECRET_KEY) {
    logger.warn('[Stripe] STRIPE_SECRET_KEY is not configured — Stripe features are disabled');
    stripeServerClient = null;
    return null;
  }

  stripeServerClient = new Stripe(env.STRIPE_SECRET_KEY);
  return stripeServerClient;
}
