/**
 * Cart Page Error Boundary
 * See shared/ui/route-error.tsx for the shared implementation.
 */
'use client';

import { RoutePageError } from '@/shared/ui/route-error';

export default function CartError({
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
      logContext="Cart page error:"
      description="We couldn't load your cart. Your items are safe — this is a display issue, not a lost cart."
    />
  );
}
