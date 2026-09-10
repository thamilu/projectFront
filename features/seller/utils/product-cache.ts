/**
 * Optimistic cache surgery for seller product lists.
 *
 * A seller's products appear in two independently-cached query namespaces —
 * `['products']` (the storefront catalogue) and `['seller', 'products']` (the
 * management table). Deleting a product must remove it from both, or the
 * storefront keeps showing an item the seller believes is gone.
 *
 * [DRY] This logic previously existed twice, copied almost verbatim between
 * `deleteMut.onMutate` and an unwired `_bulkDelete`, each with its own inline
 * `any` casts and its own `eslint-disable` comments. The two copies had already
 * begun to diverge: one decremented `totalElements` by 1, the other by
 * `ids.length`, and only one restored its snapshot on failure. Extracting it
 * also removes the six `no-explicit-any` suppressions those copies carried,
 * because the shape can be stated once, properly, here.
 *
 * @module features/seller/utils/product-cache
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * The paginated shape both namespaces store.
 *
 * Deliberately minimal and permissive: this module only needs to remove items
 * and adjust a count. Requiring the full `PageResponse<ProductDTO>` would
 * couple cache surgery to the entire product contract, so any future field
 * change would ripple here for no reason.
 */
interface PaginatedCacheEntry {
  content: Array<{ id: number }>;
  totalElements?: number;
  [key: string]: unknown;
}

/** Query namespaces holding a seller's products. */
const PRODUCT_QUERY_KEYS = [['products'], ['seller', 'products']] as const;

/**
 * A snapshot of every affected cache entry, for rollback.
 *
 * Opaque by design — callers pass it back to {@link restoreProductCaches}
 * rather than inspecting it, so the internal representation stays free to change.
 */
export type ProductCacheSnapshot = ReadonlyArray<readonly [readonly unknown[], unknown]>;

/** Narrow an unknown cache value to something this module can safely edit. */
function isPaginatedEntry(value: unknown): value is PaginatedCacheEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as PaginatedCacheEntry).content)
  );
}

/**
 * Optimistically remove products from every cached list, returning a snapshot.
 *
 * Cancels in-flight fetches first: without that, a request that resolves after
 * this write would overwrite the optimistic state and make the deleted rows
 * reappear — the classic optimistic-update race.
 *
 * @param queryClient React Query client.
 * @param productIds  Ids to remove. One id and many follow the same path, which
 *                    is what keeps single and bulk delete behaving identically.
 * @returns Snapshot to pass to {@link restoreProductCaches} on failure.
 */
export async function removeProductsFromCaches(
  queryClient: QueryClient,
  productIds: readonly number[]
): Promise<ProductCacheSnapshot> {
  await Promise.all(
    PRODUCT_QUERY_KEYS.map((queryKey) => queryClient.cancelQueries({ queryKey }))
  );

  const entries = PRODUCT_QUERY_KEYS.flatMap((queryKey) =>
    queryClient.getQueriesData({ queryKey })
  );

  const snapshot: ProductCacheSnapshot = entries.map(([key, data]) => [key, data] as const);
  const removing = new Set(productIds);

  for (const [key, data] of entries) {
    if (!isPaginatedEntry(data)) continue;

    queryClient.setQueryData(key, (current: unknown) => {
      if (!isPaginatedEntry(current)) return current;

      const remaining = current.content.filter((item) => !removing.has(item.id));

      return {
        ...current,
        content: remaining,
        // Derived from what was actually removed from *this* entry, not from
        // `productIds.length`. A given cache page may hold only some of the
        // deleted ids, so subtracting the request size would drift the count.
        totalElements: Math.max(0, (current.totalElements ?? 0) - (current.content.length - remaining.length)),
      };
    });
  }

  return snapshot;
}

/**
 * Restore caches from a snapshot after a failed mutation.
 *
 * Without this the optimistic removal stands, so a seller sees a product
 * disappear and believes it was deleted when the server rejected the request —
 * the precise failure mode this project has already been bitten by elsewhere.
 */
export function restoreProductCaches(
  queryClient: QueryClient,
  snapshot: ProductCacheSnapshot | undefined
): void {
  if (!snapshot) return;
  for (const [key, data] of snapshot) {
    queryClient.setQueryData(key, data);
  }
}

/**
 * Refetch both namespaces so the client reconciles with the server.
 *
 * Called on settle regardless of outcome: the server may have applied a partial
 * change, and only it knows the true state.
 */
export function invalidateProductCaches(queryClient: QueryClient): void {
  for (const queryKey of PRODUCT_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey });
  }
}
