/// <reference lib="webworker" />
/* eslint-disable no-console */

// Service Worker for PWA functionality - Enterprise-grade TypeScript implementation
// CRITICAL: Uses IndexedDB (idb-keyval) instead of localStorage (which is unavailable in SW context)
// SECURITY: Never caches authenticated routes; uses credentials for sync requests
// PERFORMANCE: Network-first for HTML, cache-first for static assets, never caches API

import { get } from 'idb-keyval';

declare const self: ServiceWorkerGlobalScope;

// Type definitions
interface SWConfig {
  CACHE_NAME: string;
  STATIC_URLS: string[];
  STATIC_PREFIX: string;
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
  CACHE_NAME: 'eshop-cache-v2',
  // Only cache static, non-authenticated routes
  STATIC_URLS: [
    '/',
    '/products',
    '/offline',
    '/manifest.json',
  ],
  STATIC_PREFIX: '/_next/static/',
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

// Install: precache static resources and skip waiting for immediate activation
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(SW_CONFIG.CACHE_NAME)
      .then((cache) => cache.addAll(SW_CONFIG.STATIC_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches and claim clients immediately
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== SW_CONFIG.CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: intelligent caching strategy based on request type
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache API requests - they must always be fresh
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for HTML navigation (dynamic content)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            return response;
          }
          return caches.match('/offline').then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
        .catch(() =>
          caches.match('/offline').then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          })
        )
    );
    return;
  }

  // Cache-first for Next.js static assets (hashed filenames)
  if (url.pathname.startsWith(SW_CONFIG.STATIC_PREFIX)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(SW_CONFIG.CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first fallback
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || new Response('Not found', { status: 404 });
      })
    )
  );
});

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
