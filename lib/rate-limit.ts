// Upstash-backed rate limiter with in-memory fallback.
// Uses dynamic import to avoid hard dependency at compile time. If Upstash
// env vars and packages are available, it will use the distributed limiter.
// Otherwise a best-effort in-memory sliding window is used (not for multi-instance production).

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let upstash: any = undefined; // undefined = not initialized yet

const memStore = new Map<string, { count: number; resetAt: number }>();
const MEM_WINDOW_MS = 60_000;
const MEM_MAX = 10;

async function initUpstashIfNeeded() {
  if (upstash !== undefined) return; // already attempted

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;
    if (!url || !token) {
      upstash = null;
      return;
    }

    // Dynamic import to keep package optional for local/dev
    // Dynamic import of optional upstash packages.
    const { Redis } = await import('@upstash/redis');
    const { Ratelimit } = await import('@upstash/ratelimit');

    // Use unknown and narrow where necessary to avoid `any` usage
    const redis = (Redis as unknown as { fromEnv?: () => unknown }).fromEnv
      ? (Redis as unknown as { fromEnv: () => unknown }).fromEnv()
      : new (Redis as unknown as { new (opts: { url: string; token: string }): unknown })({ url, token });

    upstash = new (Ratelimit as unknown as { new (opts: { redis: unknown; limiter: unknown; analytics?: boolean }): unknown })({
      redis,
      limiter: (Ratelimit as unknown as { slidingWindow: (n: number, per: string) => unknown }).slidingWindow(MEM_MAX, '1 m'),
      analytics: true,
    });
  } catch {
    // If anything fails, mark as unavailable and fall back to in-memory
    upstash = null;
  }
}

export async function limit(key: string): Promise<RateLimitResult> {
  await initUpstashIfNeeded();

  if (upstash) {
    try {
      const r = await upstash.limit(key);
      return {
        success: Boolean(r?.success),
        remaining: typeof r?.remaining === 'number' ? r.remaining : 0,
        reset: typeof r?.reset === 'number' ? r.reset : Date.now() + MEM_WINDOW_MS,
      };
    } catch {
      // fall through to in-memory fallback
    }
  }

  // In-memory sliding window fallback
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + MEM_WINDOW_MS });
    return { success: true, remaining: MEM_MAX - 1, reset: now + MEM_WINDOW_MS };
  }

  entry.count++;
  memStore.set(key, entry);
  return { success: entry.count <= MEM_MAX, remaining: Math.max(0, MEM_MAX - entry.count), reset: entry.resetAt };
}

export default { limit };
