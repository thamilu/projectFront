/**
 * Protected Route HOC
 * 
 * Higher-Order Component for protecting routes that require authentication
 * 
 * @module components/auth/ProtectedRoute
 */

'use client';

import { useEffect, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useKeycloakAuth } from '@/hooks/useKeycloakAuth';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Higher-Order Component for route protection
 * 
 * @example
 * ```tsx
 * const ProtectedDashboard = withProtectedRoute(DashboardPage, {
 *   requiredRoles: ['admin', 'user'],
 *   redirectTo: '/login',
 * });
 * ```
 */
export function withProtectedRoute<P extends object>(
  Component: ComponentType<P>,
  options: ProtectedRouteProps = {}
) {
  const {
    requiredRoles = [],
    redirectTo = '/login',
    fallback,
  } = options;
  
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const { isAuthenticated, isLoading, user: _user, hasAnyRole } = useKeycloakAuth();
    
    useEffect(() => {
      if (!isLoading) {
        // Not authenticated - redirect to login
        if (!isAuthenticated) {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          router.replace(`${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`);
          return;
        }
        
        // Authenticated but missing required roles
        if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
          router.replace('/403'); // Forbidden page
          return;
        }
      }
    }, [isAuthenticated, isLoading, router, hasAnyRole]);
    
    // Loading state
    if (isLoading) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      );
    }
    
    // Not authenticated
    if (!isAuthenticated) {
      return null; // Will redirect via useEffect
    }
    
    // Missing required roles
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return null; // Will redirect via useEffect
    }
    
    // Render protected component
    return <Component {...props} />;
  };
}

/**
 * Component-based protected route wrapper
 * 
 * @example
 * ```tsx
 * <ProtectedRoute requiredRoles={['admin']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps & { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasAnyRole } = useKeycloakAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        router.replace(`${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`);
        return;
      }
      
      if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
        router.replace('/403');
        return;
      }
    }
  }, [isAuthenticated, isLoading, router, hasAnyRole, requiredRoles, redirectTo]);
  
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    );
  }
  
  if (!isAuthenticated || (requiredRoles.length > 0 && !hasAnyRole(requiredRoles))) {
    return null;
  }
  
  return <>{children}</>;
}
