/**
 * Enterprise Auth Guard Component
 * 
 * Wraps child components and enforces authentication/authorization
 * requirements. Automatically redirects to login if unauthenticated.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';
import { useAuth } from '../../hooks/use-auth';

export interface AuthGuardProps {
  children: ReactNode;
  /** Required roles (user must have at least one) */
  requiredRoles?: string[];
  /** Required single role (convenience prop matching user specification) */
  requiredRole?: 'CUSTOMER' | 'SELLER' | 'DELIVERY_AGENT';
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
  requiredRole,
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
  const rolesToCheck = [...requiredRoles];
  if (requiredRole) {
    rolesToCheck.push(requiredRole);
  }

  if (rolesToCheck.length > 0 && !hasAnyRole(rolesToCheck)) {
    console.log('[AuthGuard] Redirecting to /unauthorized due to missing roles:', { 
      required: rolesToCheck, 
      userRoles: (user as any)?.roles 
    });
    router.push(APP_ROUTES.UNAUTHORIZED);
    return null;
  }

  return <>{children}</>;
}
