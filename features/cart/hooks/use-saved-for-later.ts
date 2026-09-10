'use client';

/**
 * "Save for later" — move an item out of the cart without losing it.
 *
 * [DATA LOSS] The previous implementation destroyed items. `moveToSaved` issued
 * a real `removeCartItem` server mutation and then pushed the item into plain
 * `useState`, so a refresh, a navigation, or a crash lost it permanently. Its
 * counterpart `restoreFromSaved` removed the item from the saved list and
 * showed *"Moved back to cart"* — but never called any cart mutation, so the
 * item vanished from both places while the shopper was told it was restored.
 *
 * Both defects came from the same root cause: the two halves were written as
 * independent local-state updates rather than as a transfer with a defined
 * order of operations. This hook makes that order explicit and enforces it:
 *
 *   **Save:**    persist first → then remove from the cart.
 *   **Restore:** add to the cart first → then drop from the saved list.
 *
 * In both directions the item exists in at least one place at every instant.
 * If the second step fails, the first is rolled back.
 *
 * [SCOPE] The backend exposes no saved-items resource, so the list is stored
 * per-device in `localStorage`. That is a real limitation — it does not follow
 * the shopper to another device — and the cart page states so rather than
 * implying a synced list. When a backend endpoint exists, only the two
 * `persist` calls below need to change; the transfer semantics stay as they are.
 *
 * @module features/cart/hooks/use-saved-for-later
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPersistentStore } from '@/shared/utils/persistent-state';

// ============================================================
// 1. MODEL
// ============================================================

/**
 * A cart line parked for later.
 *
 * Deliberately stores `productId` and `quantity` rather than the cart-item id:
 * cart-item ids are server-assigned and do not survive removal, so restoring by
 * one would fail. Name, price and image are cached only so the list can render
 * without a fetch — price is re-read from the server on restore, so a stale
 * cached figure can never be charged.
 */
export interface SavedForLaterItem {
  productId: number;
  quantity: number;
  /** Display-only snapshot, captured when saved. */
  name: string;
  /** Display-only snapshot. Never used for pricing. */
  price: number;
  image?: string;
  savedAt: string;
}

/** Bounds storage growth; the oldest entry is evicted past this. */
const MAX_SAVED_ITEMS = 50;

/**
 * Entries expire after 90 days. A list a shopper has not touched in three
 * months is clutter, and unbounded retention of stale prices invites
 * confusion when they eventually return to it.
 */
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1_000;

function isSavedItem(value: unknown): value is SavedForLaterItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as SavedForLaterItem;
  return (
    typeof item.productId === 'number' &&
    Number.isFinite(item.productId) &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof item.name === 'string'
  );
}

const savedItemsStore = createPersistentStore<SavedForLaterItem[]>({
  key: 'eshop:cart:saved-for-later',
  version: 1,
  fallback: [],
  maxAgeMs: MAX_AGE_MS,
  // Filtering rather than rejecting wholesale: one malformed entry should not
  // discard a shopper's entire saved list.
  validate: (value): value is SavedForLaterItem[] => Array.isArray(value),
});

// ============================================================
// 2. HOOK
// ============================================================

export interface UseSavedForLaterResult {
  items: SavedForLaterItem[];
  /** True when the last write could not be persisted (quota, blocked storage). */
  isPersistenceUnavailable: boolean;
  /** Persist an item. Returns false if it could not be stored — do not remove from the cart. */
  save: (item: Omit<SavedForLaterItem, 'savedAt'>) => boolean;
  /** Drop an item from the list (after a successful restore, or an explicit delete). */
  remove: (productId: number) => void;
  /** Re-insert an item, used to roll back a failed restore. */
  restoreEntry: (item: SavedForLaterItem) => void;
  find: (productId: number) => SavedForLaterItem | undefined;
}

export function useSavedForLater(): UseSavedForLaterResult {
  const [items, setItems] = useState<SavedForLaterItem[]>([]);
  const [isPersistenceUnavailable, setPersistenceUnavailable] = useState(false);

  // Hydrated in an effect rather than via a lazy `useState` initialiser:
  // reading storage during render would produce server/client markup mismatch,
  // since the server has no storage to read.
  useEffect(() => {
    setItems(savedItemsStore.read().filter(isSavedItem));
  }, []);

  // Keep tabs consistent — a shopper with the cart open twice should not see
  // two different saved lists.
  useEffect(
    () => savedItemsStore.subscribe((next) => setItems(next.filter(isSavedItem))),
    []
  );

  /**
   * Apply an update to both React state and storage.
   *
   * Returns whether the write landed, so callers can refuse to take a
   * destructive follow-up action (removing from the cart) when it did not.
   */
  const commit = useCallback(
    (updater: (current: SavedForLaterItem[]) => SavedForLaterItem[]): boolean => {
      const next = updater(savedItemsStore.read().filter(isSavedItem));
      const persisted = savedItemsStore.write(next);

      setPersistenceUnavailable(!persisted);
      // State is updated regardless: the shopper still sees the change within
      // this session even when it cannot outlive it.
      setItems(next);

      return persisted;
    },
    []
  );

  const save = useCallback(
    (item: Omit<SavedForLaterItem, 'savedAt'>): boolean =>
      commit((current) => {
        const withoutDuplicate = current.filter((i) => i.productId !== item.productId);
        const next = [{ ...item, savedAt: new Date().toISOString() }, ...withoutDuplicate];
        // Newest-first, so the cap evicts the oldest entry.
        return next.slice(0, MAX_SAVED_ITEMS);
      }),
    [commit]
  );

  const remove = useCallback(
    (productId: number): void => {
      commit((current) => current.filter((item) => item.productId !== productId));
    },
    [commit]
  );

  const restoreEntry = useCallback(
    (item: SavedForLaterItem): void => {
      commit((current) =>
        current.some((i) => i.productId === item.productId) ? current : [item, ...current]
      );
    },
    [commit]
  );

  const find = useCallback(
    (productId: number) => items.find((item) => item.productId === productId),
    [items]
  );

  return useMemo(
    () => ({ items, isPersistenceUnavailable, save, remove, restoreEntry, find }),
    [items, isPersistenceUnavailable, save, remove, restoreEntry, find]
  );
}
