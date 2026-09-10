/**
 * Orders Page Error Boundary
 * See shared/ui/route-error.tsx for the shared implementation.
 */
'use client';

import { RoutePageError } from '@/shared/ui/route-error';

export default function OrdersError({
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
      logContext="Orders page error:"
      description="We couldn't load your order history. Your orders are unaffected — this is a display issue."
    />
  );
}
