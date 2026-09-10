/**
 * Seller inventory API.
 *
 * [CORRECTNESS] The seller inventory page previously had no API layer at all.
 * Its entire table was a module-level `MOCK_INVENTORY` constant — five invented
 * SKUs shown identically to every seller — and stock edits updated `useState`
 * only. A seller who set a sold-out product to zero saw it as out of stock
 * while the storefront kept selling it, producing oversells, cancellations and
 * marketplace penalties, with the seller reasonably believing they had acted.
 *
 * @module features/inventory/api/inventory-api
 */

import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { PageRequest, PageResponse } from '@/shared/types';
import type { RequestOptions } from '@/core/client/types';

/** Stock position for one sellable product. */
export interface InventoryItemDTO {
  productId: number;
  name: string;
  sku: string;
  /** Units currently sellable. */
  stockQuantity: number;
  /** Level at or below which the item is flagged as low. Seller-configurable. */
  lowStockThreshold: number;
  /** Units held against unpaid orders — visible but not sellable. */
  reservedQuantity?: number;
  imageUrl?: string;
  updatedAt?: string;
}

/** Filters accepted by the inventory list endpoint. */
export interface InventoryFilters {
  /** Free-text match against name and SKU. */
  search?: string;
  /** Restrict to items at or below their own threshold. */
  lowStockOnly?: boolean;
  /** Restrict to items with zero sellable stock. */
  outOfStockOnly?: boolean;
}

/** A single stock correction. */
export interface StockAdjustment {
  productId: number;
  stockQuantity: number;
}

/**
 * Derived availability state.
 *
 * Computed from quantity and threshold rather than stored, so it can never
 * disagree with the numbers beside it — the mock data carried a hand-written
 * `status` string that did exactly that (an item with stock 12 and threshold 8
 * was labelled "Low Stock").
 */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function deriveStockStatus(item: InventoryItemDTO): StockStatus {
  if (item.stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (item.stockQuantity <= item.lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export const inventoryApi = {
  /** Page through the signed-in seller's inventory. */
  list: async (
    params: PageRequest & InventoryFilters,
    options: RequestOptions = {}
  ): Promise<PageResponse<InventoryItemDTO>> => {
    const { data } = await apiClient.get<PageResponse<InventoryItemDTO>>(
      API_ENDPOINTS.SELLER.INVENTORY,
      { params, signal: options.signal }
    );
    return data;
  },

  /**
   * Apply one or more stock corrections.
   *
   * Batched deliberately: a seller doing a stock-take adjusts many rows, and
   * one request per row is both slow and non-atomic — a partial failure would
   * leave the catalogue in a state neither the seller nor the system intended.
   */
  adjustStock: async (adjustments: StockAdjustment[]): Promise<InventoryItemDTO[]> => {
    const { data } = await apiClient.patch<InventoryItemDTO[]>(API_ENDPOINTS.INVENTORY.UPDATE, {
      adjustments,
    });
    return data;
  },

  /** Items at or below their threshold, for the dashboard's alert surface. */
  lowStock: async (options: RequestOptions = {}): Promise<InventoryItemDTO[]> => {
    const { data } = await apiClient.get<InventoryItemDTO[]>(API_ENDPOINTS.INVENTORY.LOW_STOCK, {
      signal: options.signal,
    });
    return data;
  },
};
