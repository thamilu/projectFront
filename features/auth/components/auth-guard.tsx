/**
 * Auth Guard Component
 * 
 * Wraps child components and enforces authentication/authorization
 * requirements. Automatically redirects to login if unauthenticated.
 * 
 * @module components/auth/auth-guard
 */

'use client';

import { useAuth } from '@/hooks/use-auth-nextauth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export interface AuthGuardProps {
  children: ReactNode;
  /** Required roles (user must have at least one) */
  requiredRoles?: string[];
  /** Custom loading fallback */
  fallback?: ReactNode;
}

/**
 * Protects routes and components with authentication and role requirements
 * 
 * @example
 * ```tsx
 * // Require authentication only
 * <AuthGuard>
 *   <AccountDashboard />
 * </AuthGuard>
 * 
 * // Require specific roles
 * <AuthGuard requiredRoles={['ADMIN', 'SELLER']}>
 *   <AdminPanel />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requiredRoles = [],
  fallback,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasAnyRole, login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  // Show loading state
  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      )
    );
  }

  // Not authenticated - login effect will trigger
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    console.log('[AuthGuard] Redirecting to /unauthorized due to missing roles:', { required: requiredRoles, userRoles: user?.roles });
    router.push(APP_ROUTES.UNAUTHORIZED);
    return null;
  }

  return <>{children}</>;
}
