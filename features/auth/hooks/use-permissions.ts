// ============================================================
// features/auth/hooks/use-permissions.ts
// Authorization surface: "what can this user do." Composes useAuth()
// rather than duplicating it — role checks (hasRole/hasAnyRole/isSeller/
// isCustomer/isDeliveryAgent) are re-exported directly from useAuth(),
// not reimplemented, so there is exactly one role-comparison
// implementation in the app instead of two with different semantics
// (this file previously had its own case-insensitive hasRole, diverging
// from useAuth()'s exact-match one). Identity/session state (user,
// isLoading, isAuthenticated) deliberately isn't re-exposed here — that's
// useAuth()'s job; this hook is authorization-only.
// ============================================================

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import { mapUserRole } from '@/domains/auth/utils/role-mapper';
import { ROLE_DASHBOARD_MAP } from '@/domains/auth/services/role-dashboard-map';

// ─── Transitional Permission Grant ─────────────────────────────
//
// shared/types/next-auth.d.ts's Session['user'] has no `permissions`
// field — nothing in this app's auth pipeline (lib/auth/index.ts's
// callbacks, session.schema.ts) issues one. `permissions` below is
// therefore always []. The only two permission strings anything actually
// checks today are features/seller/config/navigation.ts's Inventory and
// Orders nav items ('manage_inventory', 'view_orders') — real sellers
// need both to see their own nav. This allowlist exists so hasPermission
// keeps working for exactly those two real cases WITHOUT granting a
// seller every permission string that could ever be checked (the
// previous version returned true unconditionally for any permission once
// roles included SELLER — a real privilege-escalation shape, even though
// nothing in this app currently checks a permission that would exploit
// it). Delete this entirely once the backend issues real permissions on
// the session and switch hasPermission to check that array only.
const SELLER_TRANSITIONAL_PERMISSIONS: ReadonlySet<string> = new Set([
  'manage_inventory',
  'view_orders',
]);

export interface UsePermissionsReturn {
  /** Highest-priority role, using the SAME priority order role-dashboard-map.ts uses for routing — not roles[0]. */
  role: UserRole | null;
  roles: UserRole[];
  /** Always [] today — see the module-level comment on SELLER_TRANSITIONAL_PERMISSIONS. */
  permissions: string[];
  hasRole: (role: UserRole | string) => boolean;
  hasAnyRole: (roles: readonly (UserRole | string)[]) => boolean;
  /**
   * Checks an explicit permission grant (always false today — no real
   * grants exist yet), then falls back to SELLER_TRANSITIONAL_PERMISSIONS
   * for the two real, currently-gated nav permissions. Never returns true
   * for a permission string outside that allowlist just because the user
   * is a seller — that was the bug. UI-gating only, same caveat as
   * useAuth()'s IPermissionService: never a real authorization boundary.
   */
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Empty requirement list denies (secure default), not Array.every([]) === true. */
  hasAllPermissions: (permissions: string[]) => boolean;
  isSeller: boolean;
  isCustomer: boolean;
  isDeliveryAgent: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, hasRole, hasAnyRole, isSeller, isCustomer, isDeliveryAgent } = useAuth();

  // Validated against the same allowlist auth-service.ts uses (mapUserRole)
  // rather than an unchecked cast — an unrecognized raw role string (e.g.
  // a Keycloak realm role like offline_access) is filtered out here, not
  // silently treated as a UserRole.
  const roles = useMemo((): UserRole[] => {
    const raw = user?.roles ?? [];
    return raw.map((r) => mapUserRole(r)).filter((r): r is UserRole => r !== null);
  }, [user]);

  const role = useMemo((): UserRole | null => {
    if (roles.length === 0) return null;
    for (const entry of ROLE_DASHBOARD_MAP) {
      if (roles.includes(entry.role)) return entry.role;
    }
    return roles[0];
  }, [roles]);

  const permissions = useMemo((): string[] => [], []);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!permission) return false;
      if (permissions.includes(permission)) return true;

      // Wildcard match — assumes a 'resource:action' format. No real
      // permission string in this app currently contains ':' (both real
      // strings, 'manage_inventory'/'view_orders', are flat), so this
      // branch is presently inert; kept for whenever a real, colon-scoped
      // permissions claim is issued, matching that eventual format.
      const [resource] = permission.split(':');
      if (permissions.includes(`${resource}:*`)) return true;
      if (permissions.includes('*:*')) return true;

      if (isSeller && SELLER_TRANSITIONAL_PERMISSIONS.has(permission)) {
        return true;
      }

      return false;
    },
    [permissions, isSeller]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean =>
      requiredPermissions.some((perm) => hasPermission(perm)),
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      if (requiredPermissions.length === 0) return false;
      return requiredPermissions.every((perm) => hasPermission(perm));
    },
    [hasPermission]
  );

  return {
    role,
    roles,
    permissions,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSeller,
    isCustomer,
    isDeliveryAgent,
  };
}
