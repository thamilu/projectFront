import { useMutation } from '@tanstack/react-query';
import { createPaymentIntent } from '../api/payment-api';

/**
 * No onSuccess/onError toast wiring here (unlike most mutation hooks in this
 * codebase) — the checkout page orchestrates this as one step in a larger
 * sequence (create order → create intent → collect payment) and needs to
 * react to failure at each step differently, not with a generic toast.
 */
export function useCreatePaymentIntent() {
  return useMutation({ mutationFn: createPaymentIntent });
}
