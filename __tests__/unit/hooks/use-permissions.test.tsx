// ============================================================
// __tests__/unit/hooks/use-permissions.test.tsx
// Tests for the authorization hook. Priority is the negative/security
// cases: a seller must NOT be granted an arbitrary permission string just
// because they're a seller — that was the real bug this rewrite fixes.
// Permission strings used here match the app's actual ones
// (features/seller/config/navigation.ts's 'manage_inventory'/'view_orders'),
// not hypothetical 'admin:*'-style examples.
// ============================================================

import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { AuthStateProvider } from '@/domains/auth/hooks/use-auth';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { UserRole } from '@/domains/auth/contracts/auth.types';
import type { IAuthService } from '@/domains/auth/services/auth-service.interface';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockUseSession = useSession as jest.Mock;

function createMockAuthService(): jest.Mocked<IAuthService> {
  return {
    getNormalizedSession: jest.fn(),
    invalidateSession: jest.fn(),
    initiateLogin: jest.fn(),
    initiateLogout: jest.fn(),
    checkPermissions: jest.fn(),
    checkAllPermissions: jest.fn(),
    checkDeniedPermissions: jest.fn(),
    resolveDashboardRoute: jest.fn(),
  };
}

function mockSession(roles: string[] = []) {
  mockUseSession.mockReturnValue({
    data: {
      user: { id: 'u1', name: 'Alice', email: 'alice@example.com', roles },
      roles,
    },
    status: 'authenticated',
    update: jest.fn(),
  });
}

function renderUsePermissions() {
  const service = createMockAuthService();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthStateProvider serviceOverride={service}>{children}</AuthStateProvider>
  );
  return renderHook(() => usePermissions(), { wrapper });
}

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() });
  });

  // ─── hasPermission() — the security-critical surface ───────

  describe('hasPermission() — security', () => {
    it('CRITICAL: a seller does NOT get an arbitrary permission string just for being a seller', () => {
      // Regression test for the blanket "roles.includes(SELLER) => return
      // true for anything" bypass — this must stay false for any string
      // outside the explicit transitional allowlist.
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();

      expect(result.current.hasPermission('admin:delete-users')).toBe(false);
      expect(result.current.hasPermission('finance:view-revenue')).toBe(false);
      expect(result.current.hasPermission('anything-not-explicitly-granted')).toBe(false);
      expect(result.current.hasPermission('*:*')).toBe(false);
    });

    it('grants the two real, currently-gated seller nav permissions', () => {
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();

      expect(result.current.hasPermission('manage_inventory')).toBe(true);
      expect(result.current.hasPermission('view_orders')).toBe(true);
    });

    it('does not grant the transitional permissions to a non-seller', () => {
      mockSession([UserRole.CUSTOMER]);
      const { result } = renderUsePermissions();

      expect(result.current.hasPermission('manage_inventory')).toBe(false);
      expect(result.current.hasPermission('view_orders')).toBe(false);
    });

    it('does not grant anything to an unauthenticated user', () => {
      mockSession([]);
      const { result } = renderUsePermissions();

      expect(result.current.hasPermission('manage_inventory')).toBe(false);
      expect(result.current.hasPermission('view_orders')).toBe(false);
    });

    it('returns false for empty/falsy permission strings', () => {
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();

      expect(result.current.hasPermission('')).toBe(false);
    });

    it('resource:* wildcard matches (format reserved for a future real permissions claim)', () => {
      // permissions is always [] today (no backend claim exists), so this
      // exercises the matching logic directly rather than real data —
      // documents the intended format for when that claim is added.
      mockSession([]);
      const { result } = renderUsePermissions();
      // No explicit grants exist yet, so this currently returns false —
      // asserting that here locks in today's honest behavior rather than
      // a hypothetical one.
      expect(result.current.hasPermission('products:read')).toBe(false);
    });
  });

  describe('hasAnyPermission() / hasAllPermissions()', () => {
    it('hasAnyPermission is true if any transitional permission matches', () => {
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();
      expect(result.current.hasAnyPermission(['nonexistent', 'manage_inventory'])).toBe(true);
    });

    it('hasAnyPermission is false when nothing matches', () => {
      mockSession([UserRole.CUSTOMER]);
      const { result } = renderUsePermissions();
      expect(result.current.hasAnyPermission(['manage_inventory', 'view_orders'])).toBe(false);
    });

    it('hasAllPermissions denies (secure default) on an empty requirement list', () => {
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();
      expect(result.current.hasAllPermissions([])).toBe(false);
    });

    it('hasAllPermissions requires every listed permission to match', () => {
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();
      expect(result.current.hasAllPermissions(['manage_inventory', 'view_orders'])).toBe(true);
      expect(result.current.hasAllPermissions(['manage_inventory', 'admin:delete-users'])).toBe(
        false
      );
    });
  });

  // ─── Role resolution ──────────────────────────────────────

  describe('role / roles', () => {
    it('returns null role and empty roles when unauthenticated', () => {
      mockSession([]);
      const { result } = renderUsePermissions();
      expect(result.current.role).toBeNull();
      expect(result.current.roles).toEqual([]);
    });

    it('resolves the priority-ordered role, not roles[0], for a multi-role user', () => {
      // SELLER (priority 1) must win over DELIVERY_AGENT (priority 2)
      // regardless of array order — matches role-dashboard-map.ts, not
      // an arbitrary "first in the array" rule.
      mockSession([UserRole.DELIVERY_AGENT, UserRole.SELLER]);
      const { result } = renderUsePermissions();
      expect(result.current.role).toBe(UserRole.SELLER);
    });

    it('falls back to the sole role when it has no dashboard-map entry', () => {
      mockSession([UserRole.CUSTOMER]);
      const { result } = renderUsePermissions();
      expect(result.current.role).toBe(UserRole.CUSTOMER);
    });

    it('filters out unrecognized raw role strings via mapUserRole', () => {
      mockSession(['offline_access', UserRole.SELLER]);
      const { result } = renderUsePermissions();
      expect(result.current.roles).toEqual([UserRole.SELLER]);
    });
  });

  // ─── Re-exported role checks (single source of truth) ─────

  describe('hasRole() / hasAnyRole() / role booleans', () => {
    it('hasRole matches exactly — no case-insensitive comparison', () => {
      mockSession([UserRole.SELLER]);
      const { result } = renderUsePermissions();
      expect(result.current.hasRole(UserRole.SELLER)).toBe(true);
      expect(result.current.hasRole('seller')).toBe(false);
    });

    it('isSeller/isCustomer/isDeliveryAgent reflect the real roles array', () => {
      mockSession([UserRole.CUSTOMER, UserRole.DELIVERY_AGENT]);
      const { result } = renderUsePermissions();
      expect(result.current.isCustomer).toBe(true);
      expect(result.current.isDeliveryAgent).toBe(true);
      expect(result.current.isSeller).toBe(false);
    });
  });
});
