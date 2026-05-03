import { useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from '@/types';
import { useSession, signIn, signOut } from 'next-auth/react';
import { logger } from '@/lib/observability/logger';
import { APP_ROUTES } from '@/constants/routes/app-routes';

/**
 * Standardized Authentication Hook
 * 
 * This hook is the single source of truth for authentication state.
 * It uses NextAuth sessions and completely avoids localStorage.
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user || null;

  const login = useCallback(async () => {
    try {
      await signIn('keycloak');
    } catch (error) {
      logger.error('Login failed:', { error });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({ callbackUrl: APP_ROUTES.HOME });
    } catch (error) {
      logger.error('Logout failed:', { error });
    }
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      // NextAuth session should have roles in the user object
      const roles = (user as any).roles || [];
      return roles.includes(role);
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
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
    hasRole,
    hasAnyRole,
    isSeller: hasRole('SELLER' as UserRole),
    isCustomer: hasRole('CUSTOMER' as UserRole),
  };
}
