'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { useSession, signIn, signOut } from 'next-auth/react';
import { logger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

import { authService } from '../services/auth-service';

/**
 * Enterprise Authentication Hook (Business Abstraction)
 * 
 * This hook is the single source of truth for authentication state across the application.
 * It provides a domain-friendly API while abstracting away NextAuth/Keycloak specifics.
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user || null;

  const login = useCallback(async (callbackUrl?: string) => {
    await authService.initiateLogin(callbackUrl || pathname);
  }, [pathname]);

  const logout = useCallback(async (callbackUrl?: string) => {
    await authService.initiateLogout(callbackUrl);
  }, []);

  const hasRole = useCallback(
    (role: UserRole | string) => {
      if (!user) return false;
      const roles = (user as any).roles || [];
      return roles.includes(role);
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: (UserRole | string)[]) => {
      if (!user) return false;
      const userRoles = (user as any).roles || [];
      return roles.some((r) => userRoles.includes(r));
    },
    [user]
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    update,
    hasRole,
    hasAnyRole,
    accessToken: (session as any)?.accessToken as string | undefined,
    error: (session as any)?.error as string | undefined,
    isSeller: hasRole(UserRole.SELLER),
    isCustomer: hasRole(UserRole.CUSTOMER),
    isDeliveryAgent: hasRole(UserRole.DELIVERY_AGENT),
    refreshSession: async () => {
      try {
        const { getSession } = await import('next-auth/react');
        await getSession();
      } catch (error) {
        logger.error('Session refresh failed:', { error });
      }
    }
  };
}
