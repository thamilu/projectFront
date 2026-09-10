import { useMutation } from '@tanstack/react-query';
import { validateCoupon } from '../api/coupon-api';

/**
 * No onSuccess/onError toast wiring here — the cart page needs to show the
 * server's own message (which cites the specific reason: expired, minimum
 * purchase not met, usage limit reached) rather than a generic toast, and
 * needs to react differently depending on which reason was returned.
 */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ couponCode, cartTotal }: { couponCode: string; cartTotal: number }) =>
      validateCoupon(couponCode, cartTotal),
  });
}
