'use client';

import { type ReactNode } from 'react';
import { useCartSync } from '@/features/orders/hooks/use-order-updates';

interface CartSyncListenerProps {
  children: ReactNode;
}

/**
 * CartSyncListener
 *
 * Mounts exactly one app-wide WebSocket subscription for cross-device cart
 * sync via useCartSync(). useCart() (features/cart/hooks/use-cart.ts)
 * deliberately does NOT call useCartSync() itself, since useCart() mounts
 * once per consumer — once per product card on a listing page, for example
 * — and each mount would otherwise open its own WebSocket subscription and
 * fire its own "cart updated from another device" toast simultaneously.
 * This single subscription dispatches one 'cart:sync' window event per
 * server push; every useCart() instance listens for it and invalidates its
 * own cache entry, which is cheap and idempotent no matter how many are
 * mounted.
 */
export function CartSyncListener({ children }: CartSyncListenerProps) {
  useCartSync();
  return <>{children}</>;
}
