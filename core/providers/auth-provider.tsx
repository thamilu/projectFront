/**
 * Authentication Provider
 *
 * Enterprise-grade authentication provider with:
 * - Session management
 * - Role-based access control (RBAC)
 * - Permission checking
 * - Auto-refresh on visibility change
 * - HOC for protected components
 *
 * @module components/providers/auth-provider
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/features/auth/types/auth.types';
import { logger } from '@/core/telemetry/logger';
import { apiClient } from '@/core/client';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (redirectTo?: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (role: User['roles'][number]) => boolean;
  hasAnyRole: (roles: User['roles'][number][]) => boolean;
  hasAllRoles: (roles: User['roles'][number][]) => boolean;
  canAccess: (requiredRoles?: User['roles'][number][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Manages global authentication state and provides auth utilities.
 * Automatically refreshes session on window focus and visibility change.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Fetch current session from API
   */
  const fetchSession = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      const data = response.data;

      if (data && data.id) {
        setUser(data as User);
        setStatus('authenticated');
        logger.debug('Session fetched successfully', { userId: data.id });
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error: any) {
      if (error.status === 401 || error.status === 404) {
        // 401 = unauthorized; 404 = session endpoint missing (treat as unauthenticated)
        setUser(null);
        setStatus('unauthenticated');
        if (error.status === 404) {
          logger.warn('Session endpoint not found; treating as unauthenticated', {
            status: error.status,
          });
        }
      } else {
        logger.error('Failed to fetch session', {
          status: error.status,
          message: error.message,
        });
        // On network error, only transition from loading -> unauthenticated
        setStatus((prev) => (prev === 'loading' ? 'unauthenticated' : prev));
      }
    }
  }, []);

  // Initial session fetch - ONLY if we have a reason to believe user might be authenticated
  // Don't call /api/auth/me on every page load when no session exists
  useEffect(() => {
    // Only fetch if we have any indication of an existing session
    // This prevents premature JWT refresh attempts
    const hasSessionCookie =
      document.cookie.includes('next-auth.session-token') ||
      document.cookie.includes('__Secure-next-auth.session-token');

    if (hasSessionCookie) {
      fetchSession();
    } else {
      // No session cookie = not authenticated
      setStatus('unauthenticated');
    }
  }, [fetchSession]);

  // Session refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        fetchSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [status, fetchSession]);

  // Session refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'authenticated') {
        fetchSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, fetchSession]);

  /**
   * Initiate login flow
   */
  const login = useCallback(
    (redirectTo?: string) => {
      const target = redirectTo || pathname;
      const loginUrl = `${APP_ROUTES.AUTH_LOGIN}?callbackUrl=${encodeURIComponent(target ?? '/')}`;
      router.push(loginUrl);
    },
    [router, pathname]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      const response = await apiClient.post('/api/auth/keycloak/logout');
      const data = response.data;

      // Clear local state
      setUser(null);
      setStatus('unauthenticated');

      // Redirect to Keycloak logout if URL provided
      if (data.logoutUrl) {
        window.location.href = data.logoutUrl;
      } else {
        router.push(APP_ROUTES.HOME);
        router.refresh();
      }
    } catch (error) {
      logger.error('Logout error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Force local logout even if server fails
      setUser(null);
      setStatus('unauthenticated');
      router.push(APP_ROUTES.HOME);
      router.refresh();
    }
  }, [router]);

  /**
   * Manually refresh session
   */
  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback(
    (role: User['roles'][number]) => {
      return user?.roles?.includes(role) ?? false;
    },
    [user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: User['roles'][number][]) => {
      return roles.some((role) => user?.roles?.includes(role)) ?? false;
    },
    [user]
  );

  /**
   * Check if user has all specified roles
   */
  const hasAllRoles = useCallback(
    (roles: User['roles'][number][]) => {
      return roles.every((role) => user?.roles?.includes(role)) ?? false;
    },
    [user]
  );

  /**
   * Check if user can access resource
   */
  const canAccess = useCallback(
    (requiredRoles?: User['roles'][number][]) => {
      if (!user) return false;
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return hasAnyRole(requiredRoles);
    },
    [user, hasAnyRole]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      status,
      login,
      logout,
      refresh,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      canAccess,
    }),
    [user, status, login, logout, refresh, hasRole, hasAnyRole, hasAllRoles, canAccess]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 *
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * ```tsx
 * const { user, login, logout } = useAuth();
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * HOC to protect components with authentication
 *
 * @param Component - Component to protect
 * @param options - Protection options
 *
 * @example
 * ```tsx
 * const ProtectedPage = withAuth(MyPage, {
 *   roles: ['admin'],
 *   fallback: <Loading />,
 * });
 * ```
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    roles?: User['roles'][number][];
    fallback?: React.ReactNode;
  }
) {
  return function AuthenticatedComponent(props: T) {
    const { user: ___user, status, canAccess } = useAuth();
    // const pathname = usePathname();

    // Show loading state
    if (status === 'loading') {
      return (
        options?.fallback ?? (
          <div className="flex min-h-96 items-center justify-center">
            <div className="text-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-muted-foreground mt-2 text-sm">Loading...</p>
            </div>
          </div>
        )
      );
    }

    // Redirect to login if unauthenticated
    // DISABLED - middleware handles all auth redirects
    if (status === 'unauthenticated') {
      // Don't redirect on client - middleware will handle it
      return options?.fallback ?? null;
    }

    // Check role requirements
    if (options?.roles && !canAccess(options.roles)) {
      return (
        <div className="flex min-h-100 items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to view this content.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Required roles: {options.roles.join(', ')}
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
