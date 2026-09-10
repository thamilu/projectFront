/**
 * session.ts
 *
 * Utilities for extracting and validating user roles from NextAuth sessions.
 * Provides type-safe, immutable access to role data.
 */

import type { Session } from 'next-auth';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Empty roles fallback
 * Frozen to prevent accidental mutation
 */
const EMPTY_ROLES: readonly string[] = Object.freeze([]);

// ─── Type Guards ──────────────────────────────────────────────────────────────

/**
 * Type guard to check if session has valid roles property
 *
 * @param session - NextAuth session object
 * @returns True if session has roles array
 */
function hasRoles(session: Session): session is Session & { roles: string[] } {
  return 'roles' in session && Array.isArray(session.roles);
}

/**
 * Validate that all roles are non-empty strings
 *
 * @param roles - Array to validate
 * @returns Filtered array of valid string roles
 */
function validateRoles(roles: unknown[]): string[] {
  return roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract user roles from NextAuth session
 *
 * Single source of truth for role extraction.
 * Returns immutable array to prevent accidental mutations.
 *
 * @param session - NextAuth session or null
 * @returns Readonly array of role strings (empty if none)
 *
 * @example
 * ```typescript
 * const roles = extractRoles(session);
 * if (roles.includes('ADMIN')) {
 *   // User is admin
 * }
 * ```
 *
 * @remarks
 * Requires NextAuth type augmentation in `next-auth.d.ts`:
 * ```typescript
 * declare module 'next-auth' {
 *   interface Session {
 *     roles: string[];
 *   }
 * }
 * ```
 */
export function extractRoles(session: Session | null): readonly string[] {
  // Null/undefined guard
  if (!session) {
    return EMPTY_ROLES;
  }

  // Type guard check
  if (!hasRoles(session)) {
    // Development warning for missing type augmentation
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Auth] Session missing "roles" property. ' +
          'Ensure NextAuth types are augmented in next-auth.d.ts'
      );
    }
    return EMPTY_ROLES;
  }

  // Validate and sanitize roles
  const validRoles = validateRoles(session.roles);

  // Return frozen copy to prevent mutations
  return Object.freeze(validRoles);
}
