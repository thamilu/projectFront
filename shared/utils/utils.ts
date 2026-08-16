import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from './formatters';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validates if a string is a valid source for next/image.
 * Must start with http://, https:// or /
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') return false;
  const trimmed = url.trim();

  // Basic check for prefix
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return false;
  }

  try {
    // If it's a relative URL, prepend a dummy base so URL parser doesn't throw
    const absoluteUrl = trimmed.startsWith('/') && !trimmed.startsWith('//')
      ? new URL(trimmed, 'http://localhost:3000')
      : new URL(trimmed.startsWith('//') ? 'http:' + trimmed : trimmed);

    const hostname = absoluteUrl.hostname;
    const pathname = absoluteUrl.pathname;

    // If it points to local host (e.g., localhost:3000), make sure it is an image asset, not a page route
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '3000') {
      const isPublicAsset = pathname.startsWith('/static/') ||
                            pathname.startsWith('/images/') ||
                            pathname.startsWith('/public/') ||
                            pathname.startsWith('/uploads/') ||
                            pathname.startsWith('/_next/') ||
                            /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(pathname);
      if (!isPublicAsset) {
        return false;
      }
    }

    // Generic check to reject common application routes that are definitely not images
    if (pathname.startsWith('/seller') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/customer') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')) {
      return false;
    }
  } catch {
    // If URL is malformed, return false to be safe
    return false;
  }

  return true;
}

/**
 * Standard utility to refresh the current window location in client side.
 * Safe to call in SSR environment.
 */
export function refreshPage(): void {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Simple one-way hash helper to pseudonymize user identifiers for telemetry.
 * Relies on a basic FNV-1a hash algorithm.
 */
export function hashUserId(id: string | null | undefined): string {
  if (!id) return '';
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

