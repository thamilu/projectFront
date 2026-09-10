/**
 * Checkout Page Error Boundary
 * See shared/ui/route-error.tsx for the shared implementation.
 */
'use client';

import { RoutePageError } from '@/shared/ui/route-error';
import { APP_ROUTES } from '@/shared/routes';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RoutePageError
      error={error}
      reset={reset}
      logContext="Checkout page error:"
      title="Checkout hit a snag"
      // Deliberately does NOT assert a payment/charge status ("you have not
      // been charged") — this boundary catches any rendering error on the
      // route, including one that fires after a payment step completes, and
      // a frontend error boundary has no way to confirm backend charge
      // state. Asserting the wrong thing here risks a customer retrying and
      // being double-charged. Pointing them at Orders (a real payment
      // record) is the safe recovery path.
      description="We couldn't load checkout. Before trying again, check your orders page to see if this order already went through."
      homeRoute={APP_ROUTES.ORDERS}
      homeLabel="Check my orders"
    />
  );
}
