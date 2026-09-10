/**
 * @module profile-cache
 * @description In-memory LRU cache and cross-tab synchronization.
 */

export const CACHE_CONFIG = {
  TTL_MS: 5 * 60 * 1000, // 5-minute TTL
  MAX_SIZE: 50, // Max concurrent user profiles
} as const;

export interface CacheEntry {
  readonly data: Record<string, unknown>;
  readonly hasSellerProfile: boolean;
  readonly timestamp: number;
}

/**
 * Generic LRU cache with TTL-based eviction.
 */
export class LRUCache<K, V extends { timestamp: number }> {
  private readonly store = new Map<K, V>();

  constructor(
    private readonly maxSize: number,
    private readonly ttlMs: number
  ) {}

  get(key: K): V | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    // LRU promotion: re-insert to move to tail
    this.store.delete(key);
    this.store.set(key, entry);
    return entry;
  }

  set(key: K, value: V): void {
    if (this.store.size >= this.maxSize) {
      // Evict LRU (head of Map)
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) this.store.delete(lruKey);
    }
    this.store.set(key, value);
  }

  delete(key: K): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  has(key: K): boolean {
    return this.get(key) !== null;
  }
}

/**
 * Sanitizes userId — treats empty/whitespace strings as missing.
 */
export function sanitizeUserId(id: string | null | undefined): string | undefined {
  const trimmed = id?.trim();
  return trimmed || undefined;
}

/**
 * Builds the cache key used for both the profile LRU cache and the
 * in-flight request dedup map. Composite on (userId, isSellerRole) — a
 * plain userId-only key previously let a role change mid-session (e.g. a
 * seller approval completing while a customer-shaped profile was still
 * cached) return the wrong-shaped cached entry for up to the 5-minute TTL,
 * since the cache had no way to know the cached data was for the other role.
 */
export function buildProfileCacheKey(userId: string, isSellerRole: boolean): string {
  return `${userId}:${isSellerRole}`;
}

const BROADCAST_CHANNEL_VERSION = 'v1';
const BROADCAST_CHANNEL_NAME = `profile-cache-sync-${BROADCAST_CHANNEL_VERSION}` as const;

export class ProfileCacheSync {
  private readonly channel: BroadcastChannel | null;

  constructor() {
    this.channel =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        : null;

    this.channel?.addEventListener('message', (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const rawUserId = (data as Record<string, unknown>).userId;
        if (rawUserId === undefined || typeof rawUserId === 'string') {
          const sanitized = rawUserId ? sanitizeUserId(rawUserId) : undefined;
          if (rawUserId && !sanitized) return; // Discard invalid keys
          invalidateCache(sanitized, false);
        }
      }
    });
  }

  broadcast(userId?: string): void {
    this.channel?.postMessage({ userId });
  }

  destroy(): void {
    this.channel?.close();
  }
}

/**
 * Self-cleaning BroadcastChannel singleton.
 */
export const profileCacheSync = (() => {
  let instance: ProfileCacheSync | null = null;

  if (typeof window !== 'undefined') {
    window.addEventListener(
      'pagehide',
      () => {
        instance?.destroy();
        instance = null;
      },
      { once: true }
    );
  }

  return {
    get: (): ProfileCacheSync | null => {
      if (typeof window === 'undefined') return null;
      instance ??= new ProfileCacheSync();
      return instance;
    },
  };
})();

/**
 * Profile cache singleton — lazily initialized, client-only.
 * Returns null on server to prevent SSR data leakage.
 */
export const getProfileCache = (() => {
  let instance: LRUCache<string, CacheEntry> | null = null;
  return (): LRUCache<string, CacheEntry> | null => {
    if (typeof window === 'undefined') return null;
    instance ??= new LRUCache<string, CacheEntry>(CACHE_CONFIG.MAX_SIZE, CACHE_CONFIG.TTL_MS);
    return instance;
  };
})();

export interface InflightRequest {
  readonly promise: Promise<{ data: Record<string, unknown>; sellerFound: boolean }>;
  readonly signals: Set<AbortSignal>;
  readonly listeners: Map<AbortSignal, () => void>;
  readonly networkController: AbortController;
}

/**
 * In-flight request deduplication map — lazily initialized, client-only.
 */
export const getInflightRequests = (() => {
  let instance: Map<string, InflightRequest> | null = null;
  return (): Map<string, InflightRequest> | null => {
    if (typeof window === 'undefined') return null;
    instance ??= new Map();
    return instance;
  };
})();

/**
 * Invalidates cached profile for a user, or clears all cached profiles.
 */
export function invalidateCache(userId?: string, broadcast = true): void {
  const cache = getProfileCache();
  if (!cache) return;
  if (userId) {
    // Role is boolean, so both possible composite keys are deleted —
    // simpler and safer than adding a generic prefix-scan to LRUCache for
    // a cache with only ever two keys per user.
    cache.delete(buildProfileCacheKey(userId, true));
    cache.delete(buildProfileCacheKey(userId, false));
  } else {
    cache.clear();
  }
  if (broadcast) profileCacheSync.get()?.broadcast(userId);
}
