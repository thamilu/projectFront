// ============================================================
// __tests__/unit/components/auth/role-guards.test.tsx
// Covers createRoleGuard() itself (role + fallback forwarding into
// AuthGuard) and the two real role-specific guards built on it.
// Priority: an accidental role swap (e.g. CUSTOMER -> SELLER) in either
// guard must fail loudly here, not surface as a live authorization bug.
// ============================================================

import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createRoleGuard } from '@/features/auth/components/guards/createRoleGuard';
import { CustomerGuard } from '@/features/auth/components/guards/CustomerGuard';
import { DeliveryGuard } from '@/features/delivery/components/DeliveryGuard';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { UserRole } from '@/domains/auth/contracts/auth.types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/domains/auth/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockLogin = jest.fn();

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  const hasAnyRole = jest.fn(() => true);
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    hasAnyRole,
    login: mockLogin,
    user: { roles: [] },
    ...overrides,
  });
  return hasAnyRole;
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ replace: jest.fn(), push: jest.fn() });
});

describe('createRoleGuard', () => {
  it('checks the exact role it was built with, and only that role', () => {
    const hasAnyRole = mockAuth();
    const Guard = createRoleGuard(UserRole.SELLER, 'TestSellerGuard');
    render(
      <Guard>
        <div>Protected</div>
      </Guard>
    );

    expect(hasAnyRole).toHaveBeenCalledWith([UserRole.SELLER]);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('forwards a custom fallback through to AuthGuard while loading', () => {
    mockAuth({ isLoading: true });
    const Guard = createRoleGuard(UserRole.CUSTOMER, 'TestCustomerGuard');
    render(
      <Guard fallback={<div>Custom loading</div>}>
        <div>Protected</div>
      </Guard>
    );

    expect(screen.getByText('Custom loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('sets displayName for easier debugging in React DevTools/snapshots', () => {
    const Guard = createRoleGuard(UserRole.CUSTOMER, 'TestCustomerGuard');
    expect(Guard.displayName).toBe('TestCustomerGuard');
  });
});

describe('CustomerGuard', () => {
  it('gates on UserRole.CUSTOMER specifically', () => {
    const hasAnyRole = mockAuth();
    render(
      <CustomerGuard>
        <div>Customer area</div>
      </CustomerGuard>
    );

    expect(hasAnyRole).toHaveBeenCalledWith([UserRole.CUSTOMER]);
    expect(screen.getByText('Customer area')).toBeInTheDocument();
  });

  it('does not grant access on a non-CUSTOMER role', () => {
    mockAuth({ hasAnyRole: jest.fn(() => false) });
    render(
      <CustomerGuard>
        <div>Customer area</div>
      </CustomerGuard>
    );

    expect(screen.queryByText('Customer area')).not.toBeInTheDocument();
  });
});

describe('DeliveryGuard', () => {
  it('gates on UserRole.DELIVERY_AGENT specifically', () => {
    const hasAnyRole = mockAuth();
    render(
      <DeliveryGuard>
        <div>Delivery area</div>
      </DeliveryGuard>
    );

    expect(hasAnyRole).toHaveBeenCalledWith([UserRole.DELIVERY_AGENT]);
    expect(screen.getByText('Delivery area')).toBeInTheDocument();
  });

  it('does not grant access on a non-DELIVERY_AGENT role', () => {
    mockAuth({ hasAnyRole: jest.fn(() => false) });
    render(
      <DeliveryGuard>
        <div>Delivery area</div>
      </DeliveryGuard>
    );

    expect(screen.queryByText('Delivery area')).not.toBeInTheDocument();
  });
});
