'use client';

/**
 * Saved payment method hooks.
 *
 * Both mutations invalidate rather than optimistically patch. Optimism is the
 * right default for cheap, reversible edits; it is the wrong default here,
 * because a card the user believes they deleted must not remain visibly gone if
 * the deletion actually failed. Correctness outranks perceived speed on a
 * screen about stored payment credentials.
 *
 * @module features/payments/hooks/use-payment-methods
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { paymentMethodsApi } from '../api/payment-methods-api';

const paymentMethodKeys = {
  all: ['payment-methods'] as const,
};

/** The signed-in user's stored payment methods. */
export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentMethodKeys.all,
    queryFn: ({ signal }) => paymentMethodsApi.list({ signal }),
    // Rarely changes within a session, and every mutation invalidates
    // explicitly, so a longer window costs nothing in freshness.
    staleTime: 5 * 60_000,
  });
}

/** Promote one method to the account default. */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodId: string) => paymentMethodsApi.setDefault(methodId),
    onSuccess: (methods) => {
      // The server returns the full reordered list, so it is written straight
      // to the cache — one round trip rather than a mutation plus a refetch.
      queryClient.setQueryData(paymentMethodKeys.all, methods);
      toast.success('Default payment method updated');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Could not update your default payment method.'
      );
    },
  });
}

/** Permanently detach a stored method. */
export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodId: string) => paymentMethodsApi.remove(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all });
      toast.success('Payment method removed');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Could not remove this payment method.'
      );
    },
  });
}

/**
 * Start the add-a-card flow.
 *
 * Returns the Stripe SetupIntent secret the browser needs to collect card
 * details directly against Stripe. No toast on success: the caller mounts a
 * form, which is its own feedback.
 */
export function useCreateSetupIntent() {
  return useMutation({
    mutationFn: () => paymentMethodsApi.createSetupIntent(),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Could not start adding a payment method.'
      );
    },
  });
}
