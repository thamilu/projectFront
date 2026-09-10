/**
 * URL Sanitization Utility
 *
 * Security-critical module that validates and sanitizes URLs before rendering
 * in anchor or Link elements. Prevents open redirect, XSS via javascript: URIs,
 * and protocol-relative phishing attacks.
 *
 * @module shared/utils/sanitize-url
 */

import { logSecurityEvent } from '@/core/telemetry/logger';

/**
 * Protocols explicitly blocked — case-insensitive matching after trim.
 * These protocols can execute arbitrary code or inject content when rendered
 * as anchor href attributes.
 */
const BLOCKED_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'ftp:',
] as const;

/**
 * Sanitizes a URL string to prevent XSS, open redirect, and protocol injection.
 *
 * Allowed patterns:
 * - Absolute HTTP/HTTPS URLs: `https://example.com`, `http://example.com`
 * - Root-relative paths: `/seller/register`, `/api/auth/signin?callback=...`
 * - Hash fragments: `#section-id`
 *
 * Blocked patterns:
 * - `javascript:`, `data:`, `vbscript:`, `ftp:` protocols (case-insensitive)
 * - Protocol-relative URLs: `//evil.com/path` (inherits page protocol — phishing vector)
 * - Bare relative paths: `register` (ambiguous resolution — could navigate unexpectedly)
 * - Empty or whitespace-only strings
 * - Whitespace-padded dangerous protocols: `"  javascript:alert(1)"`
 *
 * @param url - Raw URL string to sanitize.
 * @returns The original URL if safe, or `'#'` if blocked.
 *
 * @example
 * ```ts
 * sanitizeUrl('/seller/register');           // → '/seller/register'
 * sanitizeUrl('https://example.com');        // → 'https://example.com'
 * sanitizeUrl('javascript:alert(1)');        // → '#'
 * sanitizeUrl('  JAVASCRIPT:void(0)');       // → '#'
 * sanitizeUrl('//evil.com');                 // → '#'
 * sanitizeUrl('register');                   // → '#'
 * ```
 */
export function sanitizeUrl(url: string): string {
  // Trim whitespace to prevent bypass via leading/trailing spaces
  const trimmed = url.trim();

  // Block empty strings
  if (trimmed.length === 0) {
    return '#';
  }

  // Block protocol-relative URLs (//evil.com) — phishing vector
  if (trimmed.startsWith('//')) {
    logSecurityEvent('unsafe_url_blocked', {
      url: trimmed,
      reason: 'protocol_relative',
      component: 'sanitizeUrl',
    });
    return '#';
  }

  // Block dangerous protocols (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase();
  for (const protocol of BLOCKED_PROTOCOLS) {
    if (lowerTrimmed.startsWith(protocol)) {
      logSecurityEvent('unsafe_url_blocked', {
        url: trimmed,
        reason: `blocked_protocol:${protocol}`,
        component: 'sanitizeUrl',
      });
      return '#';
    }
  }

  // Allow root-relative paths (starts with / but NOT //)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Allow hash fragments
  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  // Allow absolute HTTP/HTTPS URLs
  if (lowerTrimmed.startsWith('https://') || lowerTrimmed.startsWith('http://')) {
    return trimmed;
  }

  // Block everything else (bare relative paths like "register", unknown protocols)
  logSecurityEvent('unsafe_url_blocked', {
    url: trimmed,
    reason: 'unrecognized_format',
    component: 'sanitizeUrl',
  });
  return '#';
}

/**
 * Determines if a sanitized URL points to an external origin.
 *
 * External URLs are absolute HTTP/HTTPS URLs that navigate away from the
 * current domain. Internal URLs start with `/` or `#`.
 *
 * @param url - A URL that has already been sanitized via `sanitizeUrl()`.
 * @returns `true` if the URL is an external HTTP/HTTPS link.
 *
 * @example
 * ```ts
 * isExternalUrl('https://example.com');  // → true
 * isExternalUrl('http://cdn.example.com'); // → true
 * isExternalUrl('/seller/register');     // → false
 * isExternalUrl('#section');             // → false
 * isExternalUrl('#');                    // → false
 * ```
 */
export function isExternalUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.startsWith('https://') || lower.startsWith('http://');
}
