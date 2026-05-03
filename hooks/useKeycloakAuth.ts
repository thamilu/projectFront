/**
 * Keycloak Authentication Hook (NextAuth Compatibility Wrapper)
 * 
 * Provides backward-compatible API for components migrating from PKCE to NextAuth.
 * Maps NextAuth's API to the previous Keycloak hook interface.
 * 
 * @module hooks/useKeycloakAuth
 * @deprecated Use `use-auth-nextauth` directly for new code
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { logoutAndRedirect } from '@/lib/auth/client-logout';
import { APP_ROUTES } from '@/constants/routes/app-routes';

/**
 * Decoded Token Data Interface
 */
export interface TokenData {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Enhanced Auth Hook with Keycloak-specific methods (NextAuth backed)
 */
export function useKeycloakAuth() {
  const { data: session, status } = useSession();

  const token = session?.accessToken;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenData = (session?.user as any) ?? null;
  const idToken = null; // NextAuth doesn't expose idToken by default
  const error = session?.error ?? null;
  const loginInProgress = status === 'loading';

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useMemo(() => {
    return status === 'authenticated' && !!token;
  }, [status, token]);

  /**
   * Get user info from session
   */
  const user = useMemo<TokenData | null>(() => {
    if (!session?.user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = session.user as any;
    return {
      sub: u.id ?? u.sub ?? '',
      email: u.email,
      email_verified: u.email_verified,
      name: u.name,
      preferred_username: u.preferred_username ?? u.email,
      given_name: u.given_name,
      family_name: u.family_name,
      roles: session.roles ?? [],
      realm_access: { roles: session.roles ?? [] },
      resource_access: {},
      exp: u.exp,
      iat: u.iat,
    } as TokenData;
  }, [session]);

  /**
   * Enhanced login with optional redirect
   */
  const loginWithRedirect = useCallback((redirectUri?: string) => {
    console.log('[useKeycloakAuth] loginWithRedirect called', { redirectUri });
    if (redirectUri && typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', redirectUri);
    }
    // Use NextAuth's signIn helper to start the provider flow safely.
    // This avoids manual URL construction which can cause nested callbackUrl encoding.
    console.log('[useKeycloakAuth] Calling signIn(keycloak)...');
    signIn('keycloak', { callbackUrl: redirectUri ?? '/' }).then((res) => {
      console.log('[useKeycloakAuth] signIn result:', res);
    }).catch(err => {
      console.error('[useKeycloakAuth] signIn error:', err);
    });
  }, []);

  /**
   * Enhanced logout with Keycloak session clearing
   */
  const logout = useCallback(async (redirectUri?: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirect');
      localStorage.removeItem('user');
    }

    await logoutAndRedirect({ redirectTo: redirectUri ?? '/login?force_login=1' });
  }, []);

  /**
   * Redirect to Keycloak registration page
   */
  const router = useRouter();

  const register = useCallback((redirectUri?: string) => {
    // Prefer client-side navigation to the app's registration page so the
    // custom form is shown instead of Keycloak's registration UI. Keep
    // backward-compatible behavior by storing a post-register redirect.
    const redirectTo = redirectUri || '/';
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', redirectTo);
    }
    router.push(APP_ROUTES.AUTH_REGISTER);
  }, [router]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.some(role => user.roles!.includes(role));
  }, [user]);

  /**
   * Check if user has all specified roles
   */
  const hasAllRoles = useCallback((roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.every(role => user.roles!.includes(role));
  }, [user]);

  /**
   * Get access token for API calls
   */
  const getAccessToken = useCallback((): string | null => {
    return token ?? null;
  }, [token]);

  return {
    // Auth state
    token,
    tokenData,
    user,
    idToken,
    isAuthenticated,
    isLoading: loginInProgress,
    error,

    // Auth actions
    login: loginWithRedirect,
    logout,
    register,

    // Role checks
    hasRole,
    hasAnyRole,
    hasAllRoles,

    // Utility
    getAccessToken,
  };
}
