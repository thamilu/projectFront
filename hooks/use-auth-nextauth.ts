/**
 * Custom Authentication Hook
 * 
 * Wraps NextAuth's useSession with enterprise-friendly API:
 * - Role-based access control
 * - Typed user data
 * - Loading and error states
 * - Convenient auth actions
 * 
 * @module hooks/use-auth
 */

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback, useMemo } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  roles: string[];
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface UseAuthReturn {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | undefined;
  roles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | undefined;
}

/**
 * Custom auth hook with role-based access control
 * 
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { isAuthenticated, hasRole, login } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <button onClick={login}>Sign In</button>;
 *   }
 *   
 *   if (!hasRole('ADMIN')) {
 *     return <div>Access Denied</div>;
 *   }
 *   
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const user = useMemo<User | null>(() => {
    if (!session?.user) return null;
    
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (session.user as any).id ?? '',
      email: session.user.email ?? '',
      name: session.user.name ?? '',
      image: session.user.image ?? undefined,
      roles: session.roles ?? [],
    };
  }, [session]);

  const roles = useMemo(() => (session?.roles ?? []).map((r: string) => r.toUpperCase()), [session?.roles]);

  const hasRole = useCallback(
    (role: string) => roles.includes(role.toUpperCase()),
    [roles]
  );

  const hasAnyRole = useCallback(
    (requiredRoles: string[]) =>
      requiredRoles.some((role) => roles.includes(role.toUpperCase())),
    [roles]
  );

  const hasAllRoles = useCallback(
    (requiredRoles: string[]) =>
      requiredRoles.every((role) => roles.includes(role.toUpperCase())),
    [roles]
  );

  const login = useCallback(async () => {
    // Prefer NextAuth's client helper to initiate the provider flow
    await signIn('keycloak', { callbackUrl: '/' });
  }, []);

  const logout = useCallback(async () => {
    // Keycloak federated logout URL
    const keycloakLogoutUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
    
    await signOut({
      callbackUrl: keycloakLogoutUrl,
      redirect: true,
    });
  }, []);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    accessToken: session?.accessToken,
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    login,
    logout,
    error: session?.error,
  };
}
