/**
 * Wishlist Page Error Boundary
 * See shared/ui/route-error.tsx for the shared implementation.
 */
'use client';

import { RoutePageError } from '@/shared/ui/route-error';

export default function WishlistError({
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
      logContext="Wishlist page error:"
      description="We couldn't load your wishlist. Your saved items are unaffected — this is a display issue."
    />
  );
}
