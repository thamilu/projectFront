/**
 * Avatar Utilities
 * Implements Unicode-safe initials calculation and remote origin verification.
 */

export const MAX_INITIALS = 2;

/**
 * Derive up to 2 uppercase initials from a display name, supporting unicode/emoji characters.
 * Falls back to "U" when name is absent.
 */
export function deriveInitials(name: string | null | undefined): string {
  if (!name?.trim()) return 'U';
  return [...name.trim().split(/\s+/)]
    .map((word) => [...word][0] ?? '')
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .join('')
    .toUpperCase();
}

/**
 * Validates if an avatar image URL is from a trusted origin.
 * Allowed origins:
 * - relative paths (e.g. /images/avatar.png)
 * - backend domain (process.env.NEXT_PUBLIC_API_URL or localhost/127.0.0.1)
 * - R2 storage (NEXT_PUBLIC_R2_PUBLIC_URL)
 * - res.cloudinary.com
 * - lh3.googleusercontent.com
 */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // Allow relative paths
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname;

    // Trusted hostnames list
    const trustedHosts = ['res.cloudinary.com', 'lh3.googleusercontent.com'];

    if (trustedHosts.includes(hostname)) {
      return true;
    }

    // Add public API host
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      try {
        const apiHost = new URL(apiUrl).hostname;
        if (hostname === apiHost) return true;
      } catch {
        // Ignored
      }
    }

    // Add R2 storage host
    const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (r2Url) {
      try {
        const r2Host = new URL(r2Url).hostname;
        if (hostname === r2Host) return true;
      } catch {
        // Ignored
      }
    }

    // Allow localhost/127.0.0.1 in development/testing
    if (process.env.NODE_ENV !== 'production') {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
