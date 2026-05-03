/**
 * Security Utilities
 * URL validation, redirect safety, and input sanitization
 */

/**
 * Validates if a redirect URL is safe to use
 * Only allows same-origin redirects and relative paths
 * 
 * @param url - URL to validate
 * @returns true if URL is safe, false otherwise
 */
export function validateRedirectUrl(url: string | undefined): string | null {
  if (!url) return null;
  
  try {
    // Allow relative paths that don't start with //
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    
    // For absolute URLs, validate same origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const parsed = new URL(url, appUrl);
    const base = new URL(appUrl);
    
    // Only allow same-origin redirects
    if (parsed.origin === base.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    
    return null;
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Sanitizes user input to prevent XSS
 * Use this for any user-generated content displayed in HTML
 * 
 * @param input - Raw user input
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates if a string is a valid email format
 * Simple validation - backend should do comprehensive checks
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Rate limit helper - tracks attempts per identifier
 * Use for client-side rate limiting feedback
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();
  
  check(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetAt) {
      this.attempts.set(identifier, { count: 1, resetAt: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const remaining = record.resetAt - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const loginRateLimiter = new RateLimiter();
