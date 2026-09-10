/**
 * Custom hook for real-time order updates via WebSocket
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  wsClient,
  OrderStatusUpdateEvent,
  TrackingUpdateEvent,
  InventoryUpdateEvent,
  CartUpdateEvent,
} from '@/infrastructure/realtime/websocket-client';
import { toast } from 'sonner';
import { logger } from '@/core/telemetry/logger';

/**
 * Fetches a fresh, single-use WebSocket connection ticket from /api/ws-ticket.
 * Passed to wsClient.connect() as a provider (not a static value) so
 * socket.io-client's automatic reconnection re-mints a ticket on every
 * attempt — a single-use, ~45s ticket would otherwise always fail the first
 * reconnect after any network blip. See websocket-client.ts's connect() docs.
 */
async function fetchWsTicket(): Promise<string> {
  const res = await fetch('/api/ws-ticket');
  if (!res.ok) {
    throw new Error(`Failed to obtain WebSocket ticket: ${res.status}`);
  }
  const data = await res.json();
  if (!data.ticket) {
    throw new Error('WebSocket ticket response missing ticket');
  }
  return data.ticket;
}

export function useOrderUpdates(orderId: string) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  // Initialized from the client's current state, then kept live via the
  // connect/disconnect subscriptions below — previously this called
  // wsClient.isConnected() once at render time and never updated, so a
  // component displaying "Connected"/"Disconnected" from it went stale the
  // moment the socket's actual state changed without an unrelated re-render.
  const [isConnected, setIsConnected] = useState(() => wsClient.isConnected());

  useEffect(() => {
    if (!orderId || !session?.user?.id) return;

    wsClient.connect(session.user.id, fetchWsTicket);
    wsClient.subscribeToOrder(orderId);

    logger.info('Subscribed to order updates', { orderId });

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const unsubscribeConnect = wsClient.on('connect', handleConnect);
    const unsubscribeDisconnect = wsClient.on('disconnect', handleDisconnect);

    // Handle status updates. Typed as Partial<> and guarded before use —
    // matching useInventoryUpdates/useCartSync below — since a WebSocket
    // payload isn't verified at compile time and a malformed/unexpected
    // message shouldn't crash this handler.
    const unsubscribeStatus = wsClient.on(
      `order:${orderId}:status_changed`,
      (...args: unknown[]) => {
        const data = args[0] as Partial<OrderStatusUpdateEvent>;
        logger.info('Order status updated', { payload: data });
        if (!data.status) return;
        setStatus(data.status);
        if (data.timestamp) setLastUpdate(data.timestamp);

        // Show user-friendly notification
        const statusMessages: Record<string, string> = {
          CONFIRMED: 'Your order has been confirmed!',
          PROCESSING: 'Your order is being processed',
          SHIPPED: 'Your order has been shipped!',
          DELIVERED: 'Your order has been delivered!',
          CANCELLED: 'Your order has been cancelled',
        };

        const message = statusMessages[data.status] || `Order status: ${data.status}`;
        toast.success(message);
      }
    );

    // Handle tracking updates
    const unsubscribeTracking = wsClient.on(
      `order:${orderId}:tracking_updated`,
      (...args: unknown[]) => {
        const data = args[0] as Partial<TrackingUpdateEvent>;
        logger.info('Tracking information updated', { payload: data });
        const trackingData = data.tracking as Record<string, unknown> | undefined;
        if (trackingData) setTracking(trackingData);
        if (data.timestamp) setLastUpdate(data.timestamp);

        if (data.tracking?.carrier) {
          toast.info('Tracking information updated', {
            description: `Carrier: ${data.tracking.carrier}`,
          });
        }
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeStatus();
      unsubscribeTracking();
      wsClient.unsubscribeFromOrder(orderId);
      logger.info('Unsubscribed from order updates', { orderId });
    };
  }, [orderId, session]);

  return {
    status,
    tracking,
    lastUpdate,
    isConnected,
  };
}

/**
 * Hook for real-time inventory updates
 */
export function useInventoryUpdates(productId: string) {
  const { data: session } = useSession();
  const [stock, setStock] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    // Unlike useOrderUpdates/useCartSync (both gated on an authenticated
    // session because they subscribe to a user-specific channel), stock
    // change events are broadcast per-product with no subscription step —
    // but the underlying socket still has to exist. Previously this hook
    // never called wsClient.connect() itself, so it silently did nothing
    // unless some other hook (e.g. an order-tracking page open in another
    // tab) happened to have already connected the shared socket. A guest
    // browsing a product page has no session to mint a connection ticket
    // with, so this only activates for signed-in users — a genuine
    // limitation of the ticket-per-user auth model, not something a
    // frontend-only fix can lift.
    if (session?.user?.id) {
      wsClient.connect(session.user.id, fetchWsTicket);
    }

    const unsubscribe = wsClient.on(`product:${productId}:stock_changed`, (...args: unknown[]) => {
      // Typed as the documented server contract, but still runtime-guarded
      // below — a WebSocket payload isn't verified at compile time, and a
      // malformed/unexpected message shouldn't crash this handler.
      const data = args[0] as Partial<InventoryUpdateEvent>;
      logger.info('Stock updated', { payload: data });
      const stockVal = data.stock;
      const ts = data.timestamp;
      if (typeof stockVal === 'number') setStock(stockVal);
      if (ts) setLastUpdate(ts);

      if (typeof stockVal === 'number') {
        if (stockVal === 0) {
          toast.warning('This product is now out of stock');
        } else if (stockVal < 10) {
          toast.info(`Only ${stockVal} items left in stock!`);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [productId, session]);

  return {
    stock,
    lastUpdate,
  };
}

/**
 * Hook for real-time cart synchronization
 */
export function useCartSync() {
  const { data: session } = useSession();
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const syncCart = useCallback(() => {
    if (!session?.user?.id) return;

    wsClient.emit('sync_cart', {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;

    wsClient.connect(session.user.id, fetchWsTicket);
    wsClient.subscribeToCart(session.user.id);

    const unsubscribe = wsClient.on(`cart:${session.user.id}:updated`, (...args: unknown[]) => {
      // Same rationale as useInventoryUpdates above — typed as the
      // documented contract, still runtime-guarded since it's untrusted
      // wire data.
      const data = args[0] as Partial<CartUpdateEvent>;
      logger.info('Cart synced from another device', { payload: data });
      const ts = data.timestamp;
      if (ts) setSyncedAt(ts);

      toast.info('Cart updated from another device', {
        description: 'Refreshing cart...',
      });

      // Trigger cart refresh
      window.dispatchEvent(new CustomEvent('cart:sync'));
    });

    return () => {
      unsubscribe();
    };
  }, [session]);

  return {
    syncCart,
    syncedAt,
  };
}
