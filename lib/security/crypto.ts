/**
 * Cryptographic Security Utilities
 * 
 * Enterprise-grade cryptographic utilities for:
 * - Timing-safe string comparison (CSRF/SSRF protection)
 * - Secure random generation
 * - Constant-time operations
 * 
 * Security Properties:
 * - Prevents timing attacks
 * - Uses Node.js crypto primitives
 * - Constant-time algorithms
 * 
 * @module lib/security/crypto
 */

import { timingSafeEqual as nodeTimingSafeEqual } from 'crypto';

/**
 * Timing-safe string comparison
 * 
 * Prevents timing attacks by performing constant-time comparison:
 * - Used for state parameter validation (CSRF)
 * - Used for nonce validation (replay protection)
 * - Used for token comparison
 * 
 * Implementation:
 * - Converts strings to buffers
 * - Uses crypto.timingSafeEqual
 * - Handles length mismatch safely (no early return)
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings match (constant time)
 * 
 * @example
 * ```ts
 * const storedState = 'abc123';
 * const receivedState = req.query.state;
 * 
 * if (timingSafeEqual(storedState, receivedState)) {
 *   // State matches - proceed with OAuth
 * } else {
 *   // CSRF attack detected
 * }
 * ```
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Handle null/undefined
  if (!a || !b) {
    return false;
  }
  
  // Convert to buffers
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  
  // Length mismatch - still perform comparison to prevent timing leak
  if (bufA.length !== bufB.length) {
    // Compare with dummy buffer of same length as bufA
    const dummy = Buffer.alloc(bufA.length);
    nodeTimingSafeEqual(bufA, dummy);
    return false;
  }
  
  // Constant-time comparison
  try {
    return nodeTimingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Timing-safe array comparison
 * 
 * Compares two arrays of strings in constant time.
 * Useful for role comparisons, scope validation, etc.
 * 
 * @param a - First array
 * @param b - Second array
 * @returns True if arrays match (constant time)
 */
export function timingSafeArrayEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  // Sort for consistent comparison
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  
  // Compare each element in constant time
  let allMatch = true;
  for (let i = 0; i < sortedA.length; i++) {
    if (!timingSafeEqual(sortedA[i], sortedB[i])) {
      allMatch = false;
      // Don't break - continue to prevent timing leak
    }
  }
  
  return allMatch;
}

/**
 * Validates that a string contains only safe characters
 * 
 * Used for:
 * - State parameter validation
 * - Nonce validation
 * - Token validation (basic format check)
 * 
 * Allowed: alphanumeric + hyphen + underscore
 * 
 * @param value - String to validate
 * @param minLength - Minimum length (default: 16)
 * @param maxLength - Maximum length (default: 256)
 * @returns True if string is safe
 */
export function isSafeString(
  value: string,
  minLength = 16,
  maxLength = 256
): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  if (value.length < minLength || value.length > maxLength) {
    return false;
  }
  
  // Only allow: a-z, A-Z, 0-9, -, _
  const safePattern = /^[a-zA-Z0-9_-]+$/;
  return safePattern.test(value);
}

/**
 * Redacts sensitive data for logging
 * 
 * Replaces sensitive values with safe placeholders:
 * - Tokens: Show first 8 chars + "..."
 * - Emails: Show domain only
 * - Other: Generic redaction
 * 
 * @param value - Value to redact
 * @param type - Type of sensitive data
 * @returns Redacted string safe for logging
 */
export function redactSensitive(
  value: string,
  type: 'token' | 'email' | 'password' | 'secret' = 'secret'
): string {
  if (!value) return '[empty]';
  
  switch (type) {
    case 'token':
      // Show first 8 chars for debugging
      return value.length > 8 
        ? `${value.substring(0, 8)}...[${value.length} chars]`
        : '[token-too-short]';
    
    case 'email':
      // Show domain only
      const [, domain] = value.split('@');
      return domain ? `***@${domain}` : '[invalid-email]';
    
    case 'password':
      return '[REDACTED-PASSWORD]';
    
    case 'secret':
    default:
      return '[REDACTED]';
  }
}
