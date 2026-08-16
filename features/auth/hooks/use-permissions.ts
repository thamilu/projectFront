import { useMemo, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth'; // Use the fetching hook
import { UserRole } from '@/domains/auth/contracts/auth.types';

interface UsePermissionsReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  roles: UserRole[];
  permissions: string[];
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSeller: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isLoading, isAuthenticated } = useAuth(); // NextAuth session via useAuth()

  // Handle singular vs plural roles from different auth implementations
  const roles = useMemo(() => {
    // Return empty roles while loading or if no user matches
    if (isLoading || !user) {
      return [];
    }

    // @ts-ignore - Handle potential singular role from other auth types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).role) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [(user as any).role];
    }

    // Existing use-auth returns roles array
    return user.roles || [];
  }, [user, isLoading]);

  const role = roles.length > 0 ? (roles[0] as UserRole) : null;

  // Handle permissions - default to empty if not present on user object
  // @ts-ignore - permissions might not be on AuthUser type yet
  const permissions: string[] = user?.permissions ?? [];

  const hasRole = useCallback(
    (requiredRoles: UserRole | UserRole[]): boolean => {
      if (!roles.length) return false;
      const reqRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return reqRoles.some((req) =>
        roles.some(
          (userRole) => (userRole as string).toUpperCase() === (req as string).toUpperCase()
        )
      );
    },
    [roles]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Sellers have all seller permissions
      if (roles.some((r) => ['SELLER'].includes((r as string).toUpperCase()))) {
        return true;
      }

      if (!permissions.length) return false;

      // Exact match
      if (permissions.includes(permission)) return true;

      // Wildcard match
      const [resource] = permission.split(':');
      if (permissions.includes(`${resource}:*`)) return true;

      // Super wildcard
      if (permissions.includes('*:*')) return true;

      return false;
    },
    [roles, permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.some((perm) => hasPermission(perm));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      return requiredPermissions.every((perm) => hasPermission(perm));
    },
    [hasPermission]
  );

  const isSeller = useMemo(() => hasRole('SELLER' as UserRole), [hasRole]);

  return {
    user,
    isLoading,
    isAuthenticated,
    role,
    roles: roles as UserRole[],
    permissions,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSeller,
  };
}
