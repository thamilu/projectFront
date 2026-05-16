import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes/app-routes';

/**
 * [HARDEN] Auth Utilities
 * 
 * Centralized helpers for server-side authentication and authorization.
 * These are intended for use in Server Components and Route Handlers.
 */

/**
 * Get current session
 * @returns The current session or null
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user or redirect to login
 * @returns The current user
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user) {
    redirect(APP_ROUTES.AUTH_LOGIN);
  }

  return session.user;
}

/**
 * Check if user has a specific role
 * @param role - The role to check (case-insensitive)
 * @returns boolean
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await auth();
  const roles = (session as any)?.user?.roles || (session as any)?.roles || [];
  return roles.some((r: string) => r.toUpperCase() === role.toUpperCase());
}

/**
 * Require specific role or redirect to Forbidden page
 * @param role - The role required
 * @returns The current user if authorized
 */
export async function requireRole(role: string) {
  const session = await auth();
  const roles = (session as any)?.user?.roles || (session as any)?.roles || [];
  
  const hasRequiredRole = roles.some((r: string) => r.toUpperCase() === role.toUpperCase());

  if (!session?.user || !hasRequiredRole) {
    redirect('/403');
  }

  return session.user;
}
