'use client';

/**
 * Seller inventory data hooks.
 *
 * Stock edits are applied optimistically with a full rollback on failure. That
 * combination matters here more than in most places: a seller correcting stock
 * needs the table to respond immediately, but a silently-failed correction is
 * exactly the bug this module was written to eliminate — so a rejection must
 * visibly restore the previous number rather than leave the optimistic one on
 * screen looking saved.
 *
 * @module features/inventory/hooks/use-inventory
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PageRequest, PageResponse } from '@/shared/types';
import { queryKeys } from '@/core/cache/query-keys';
import {
  inventoryApi,
  type InventoryFilters,
  type InventoryItemDTO,
  type StockAdjustment,
} from '../api/inventory-api';

type InventoryQueryKey = readonly unknown[];

/** Namespaced so a filtered view does not evict an unfiltered one. */
function inventoryKey(params: PageRequest & InventoryFilters): InventoryQueryKey {
  return [...queryKeys.seller.inventory, params] as const;
}

/**
 * Page through the seller's inventory.
 *
 * `placeholderData` keeps the previous page visible while the next loads, so
 * paging or searching does not blank the table and shift the layout.
 */
export function useInventory(params: PageRequest & InventoryFilters) {
  return useQuery({
    queryKey: inventoryKey(params),
    queryFn: ({ signal }) => inventoryApi.list(params, { signal }),
    placeholderData: (previous) => previous,
    // Stock moves as orders are placed, so a cached figure goes stale quickly.
    staleTime: 15_000,
  });
}

/**
 * Apply stock corrections.
 *
 * @param params The currently-displayed query params, so the optimistic update
 *               targets the exact cache entry on screen.
 */
export function useAdjustStock(params: PageRequest & InventoryFilters) {
  const queryClient = useQueryClient();
  const key = inventoryKey(params);

  return useMutation({
    mutationFn: (adjustments: StockAdjustment[]) => inventoryApi.adjustStock(adjustments),

    onMutate: async (adjustments) => {
      // Prevent an in-flight refetch from resolving after the optimistic write
      // and reinstating the pre-edit numbers.
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<PageResponse<InventoryItemDTO>>(key);

      const byProductId = new Map(adjustments.map((a) => [a.productId, a.stockQuantity]));

      queryClient.setQueryData<PageResponse<InventoryItemDTO>>(key, (current) => {
        if (!current) return current;
        return {
          ...current,
          content: current.content.map((item) =>
            byProductId.has(item.productId)
              ? { ...item, stockQuantity: byProductId.get(item.productId) as number }
              : item
          ),
        };
      });

      return { previous };
    },

    onError: (error, _adjustments, context) => {
      // Restore the exact snapshot, so the seller sees the real stored value
      // rather than an edit that appears to have taken effect.
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(
        error instanceof Error ? error.message : 'Could not update stock. Your changes were not saved.'
      );
    },

    onSuccess: (_data, adjustments) => {
      toast.success(
        adjustments.length === 1
          ? 'Stock updated'
          : `Stock updated for ${adjustments.length} products`
      );
    },

    onSettled: () => {
      // Reconcile against the server regardless of outcome: the backend may
      // have clamped a value, or a concurrent order may have moved stock.
      queryClient.invalidateQueries({ queryKey: queryKeys.seller.inventory });
      // Storefront listings show stock too, so they must not keep a stale copy.
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/** Low-stock items, for dashboard alerting. */
export function useLowStockItems(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.seller.inventory, 'low-stock'] as const,
    queryFn: ({ signal }) => inventoryApi.lowStock({ signal }),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
