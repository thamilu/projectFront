/**
 * Cache Service
 * Client-side caching for better performance
 */

export class CacheService {
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();

  set(key: string, data: unknown, ttl: number = 300000): void {
    // Default TTL: 5 minutes
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  has(key: string): boolean {
    return this.cache.has(key) && Date.now() <= (this.cache.get(key)?.expiry || 0);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();

// Clear expired cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => cacheService.clearExpired(), 300000);
}
