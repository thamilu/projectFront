/**
 * Saved payment methods.
 *
 * [CORRECTNESS + TRUST] The account payment-methods page previously had no API
 * layer at all. It rendered a `MOCK_METHODS` constant — a fabricated
 * "HDFC Visa ••••4242", a fake UPI handle and a "₹250 balance" Paytm wallet —
 * identically for every signed-in user. Delete and Set Default mutated local
 * state and fired success toasts while persisting nothing, so both reverted on
 * refresh, and "Add New" had no handler. The page also carried the line
 * *"Your payment information is encrypted and stored securely"*, which was an
 * affirmative false statement: no payment information existed.
 *
 * [SECURITY] Card data never reaches this application. The backend brokers
 * Stripe, and these endpoints return only the non-sensitive display metadata
 * Stripe itself exposes — brand, last four digits, expiry. There is deliberately
 * no field here that could carry a PAN or CVC.
 *
 * @module features/payments/api/payment-methods-api
 */

import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { RequestOptions } from '@/core/client/types';

/** Payment instrument families the account page can display. */
export type PaymentMethodType = 'CARD' | 'UPI' | 'WALLET';

/**
 * A stored payment method, as safe to render in a browser.
 *
 * Every field here is display metadata. `last4` and `brand` are the only card
 * details Stripe returns for a saved method, and neither is sufficient to
 * initiate a charge.
 */
export interface PaymentMethodDTO {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  /** Card brand ("visa", "mastercard") — card methods only. */
  brand?: string;
  /** Final four digits — card methods only. */
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  /** Masked handle for UPI, or provider name for a wallet. */
  label?: string;
  createdAt?: string;
}

/**
 * A short-lived secret for collecting new card details.
 *
 * Returned so Stripe Elements can mount and tokenise **in the browser, against
 * Stripe directly** — card details never traverse this application's servers,
 * which is what keeps it out of PCI-DSS scope.
 */
export interface SetupIntentDTO {
  clientSecret: string;
}

export const paymentMethodsApi = {
  list: async (options: RequestOptions = {}): Promise<PaymentMethodDTO[]> => {
    const { data } = await apiClient.get<PaymentMethodDTO[]>(API_ENDPOINTS.PAYMENTS.METHODS, {
      signal: options.signal,
    });
    return data;
  },

  /** Begin adding a card. The returned secret is consumed by Stripe Elements. */
  createSetupIntent: async (): Promise<SetupIntentDTO> => {
    const { data } = await apiClient.post<SetupIntentDTO>(
      `${API_ENDPOINTS.PAYMENTS.METHODS}/setup-intent`
    );
    return data;
  },

  setDefault: async (methodId: string): Promise<PaymentMethodDTO[]> => {
    const { data } = await apiClient.patch<PaymentMethodDTO[]>(
      `${API_ENDPOINTS.PAYMENTS.METHODS}/${encodeURIComponent(methodId)}/default`
    );
    return data;
  },

  remove: async (methodId: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.PAYMENTS.METHODS}/${encodeURIComponent(methodId)}`);
  },
};

/**
 * Human-readable description of a stored method.
 *
 * Centralised so the account page, checkout, and any future order-summary view
 * describe the same card identically — three independent format strings is how
 * "Visa ••••4242" and "VISA ending 4242" end up on adjacent screens.
 */
export function describePaymentMethod(method: PaymentMethodDTO): string {
  if (method.type === 'CARD') {
    const brand = method.brand
      ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1)
      : 'Card';
    return method.last4 ? `${brand} •••• ${method.last4}` : brand;
  }
  return method.label ?? (method.type === 'UPI' ? 'UPI' : 'Wallet');
}

/** True when a saved card has passed its expiry month. */
export function isExpired(method: PaymentMethodDTO): boolean {
  if (method.type !== 'CARD' || !method.expiryYear || !method.expiryMonth) return false;
  const now = new Date();
  // A card remains valid through the final day of its expiry month.
  const expiry = new Date(method.expiryYear, method.expiryMonth, 0, 23, 59, 59);
  return expiry.getTime() < now.getTime();
}
