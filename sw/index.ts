/// <reference lib="webworker" />
/* eslint-disable no-console */

// Custom Service Worker logic injected into Workbox
import { get } from 'idb-keyval';

declare const self: ServiceWorkerGlobalScope;

// Type definitions
interface SWConfig {
  SYNC_TAGS: {
    CART: string;
    WISHLIST: string;
  };
  API: {
    CART_SYNC: string;
    WISHLIST_SYNC: string;
  };
  MAX_RETRIES: number;
}

interface PushPayload {
  body?: string;
  url?: string;
  tag?: string;
}

interface CartData {
  items: Array<{ productId: string; quantity: number }>;
  timestamp: number;
}

interface WishlistData {
  items: string[];
  timestamp: number;
}

// Configuration constants
const SW_CONFIG: SWConfig = {
  SYNC_TAGS: {
    CART: 'cart-sync',
    WISHLIST: 'wishlist-sync',
  },
  API: {
    CART_SYNC: '/api/cart/sync',
    WISHLIST_SYNC: '/api/wishlist/sync',
  },
  MAX_RETRIES: 3,
};

// Background sync with retry logic
self.addEventListener('sync', (event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag === SW_CONFIG.SYNC_TAGS.CART) {
    syncEvent.waitUntil(syncWithRetry(syncCart, SW_CONFIG.MAX_RETRIES));
  }
  if (syncEvent.tag === SW_CONFIG.SYNC_TAGS.WISHLIST) {
    syncEvent.waitUntil(syncWithRetry(syncWishlist, SW_CONFIG.MAX_RETRIES));
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.openWindow(url));
});

// Push notification handler with validation
self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {};
  try {
    const data = event.data ? event.data.text() : '';
    payload = data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Invalid push payload:', error);
  }

  const options: NotificationOptions = {
    body: payload.body || 'New notification from eShop',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: payload.url || '/',
    },
    tag: payload.tag || 'eshop-notification',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification('eShop', options));
});

// --- IndexedDB Storage Helpers (replaces localStorage) ---
async function getStoredCartData(): Promise<CartData | null> {
  try {
    const data = await get<CartData>('cart-offline-data');
    return data || null;
  } catch (error) {
    console.error('Failed to retrieve cart data from IndexedDB:', error);
    return null;
  }
}

async function getStoredWishlistData(): Promise<WishlistData | null> {
  try {
    const data = await get<WishlistData>('wishlist-offline-data');
    return data || null;
  } catch (error) {
    console.error('Failed to retrieve wishlist data from IndexedDB:', error);
    return null;
  }
}

// --- Sync Functions with Authentication ---
async function syncCart(): Promise<void> {
  const cartData = await getStoredCartData();
  if (!cartData) {
    return;
  }

  const response = await fetch(SW_CONFIG.API.CART_SYNC, {
    method: 'POST',
    body: JSON.stringify(cartData),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error(
      `Cart sync failed: ${response.status} ${response.statusText}`
    );
  }

  console.log('Cart synced successfully');
}

async function syncWishlist(): Promise<void> {
  const wishlistData = await getStoredWishlistData();
  if (!wishlistData) {
    return;
  }

  const response = await fetch(SW_CONFIG.API.WISHLIST_SYNC, {
    method: 'POST',
    body: JSON.stringify(wishlistData),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Include cookies for authentication
  });

  if (!response.ok) {
    throw new Error(
      `Wishlist sync failed: ${response.status} ${response.statusText}`
    );
  }

  console.log('Wishlist synced successfully');
}

// --- Retry Logic with Exponential Backoff ---
async function syncWithRetry(
  syncFn: () => Promise<void>,
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await syncFn();
      return;
    } catch (error) {
      console.error(`Sync attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        console.error('Max retries reached, sync failed permanently');
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
