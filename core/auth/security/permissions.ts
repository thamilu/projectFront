/**
 * Centralized Permission Registry
 * 
 * Single source of truth for Role-Based Access Control (RBAC).
 * Adheres to the [HARDEN] rule for security and DRY logic.
 */

import { Session } from 'next-auth';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'DELIVERY_AGENT' | 'ADMIN';

/**
 * Get normalized roles from session
 */
export function getRoles(session: Session | null): UserRole[] {
  const roles = session?.user?.roles || [];
  return Array.isArray(roles) ? roles.map(r => String(r).toUpperCase() as UserRole) : [];
}

/**
 * Permission: Can access seller dashboard and features
 */
export function canAccessSeller(session: Session | null): boolean {
  const roles = getRoles(session);
  return roles.includes('SELLER') || roles.includes('ADMIN');
}

/**
 * Permission: Can access delivery agent dashboard and features
 */
export function canAccessDelivery(session: Session | null): boolean {
  const roles = getRoles(session);
  return roles.includes('DELIVERY_AGENT') || roles.includes('ADMIN');
}

/**
 * Permission: Can access administrative features
 */
export function canAccessAdmin(session: Session | null): boolean {
  const roles = getRoles(session);
  return roles.includes('ADMIN');
}

/**
 * Permission: Check if user is the owner of a resource
 */
export function isResourceOwner(session: Session | null, ownerId: string): boolean {
  if (!session?.user?.id) return false;
  return session.user.id === ownerId || canAccessAdmin(session);
}
