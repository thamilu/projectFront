// ============================================================
// __tests__/unit/components/auth/AuthGuard.test.tsx
// Tests for the route/component access-control guard. Priorities: the
// render-phase navigation bug is now in an effect (not render), the
// duplicate-login-call guard, and that an unauthorized redirect uses
// replace (not push) so Back doesn't loop.
// ============================================================

import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/features/auth/components/guards/AuthGuard';
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

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogin = jest.fn();

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    hasAnyRole: jest.fn(() => true),
    login: mockLogin,
    user: { roles: [] },
    ...overrides,
  });
}

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace, push: mockPush });
  });

  it('shows an accessible loading state while isLoading', () => {
    mockAuth({ isLoading: true });
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders a custom fallback instead of the default skeleton when provided', () => {
    mockAuth({ isLoading: true });
    render(
      <AuthGuard fallback={<div>Custom loading</div>}>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(screen.getByText('Custom loading')).toBeInTheDocument();
  });

  it('calls login() when unauthenticated and not loading', () => {
    mockAuth({ isAuthenticated: false, isLoading: false });
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
    // No explicit callbackUrl passed — login() itself defaults to
    // window.location.pathname internally (see use-auth.tsx), so
    // AuthGuard must not duplicate that by passing one itself.
    expect(mockLogin).toHaveBeenCalledWith();
  });

  it('calls login() only once even if the component re-renders while still unauthenticated', () => {
    mockAuth({ isAuthenticated: false, isLoading: false });
    const { rerender } = render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    rerender(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while unauthenticated (login redirect pending)', () => {
    mockAuth({ isAuthenticated: false, isLoading: false });
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children when authenticated with no role requirement', () => {
    mockAuth({ isAuthenticated: true, isLoading: false });
    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('renders children when the user has a required role', () => {
    const hasAnyRole = jest.fn(() => true);
    mockAuth({ isAuthenticated: true, isLoading: false, hasAnyRole });
    render(
      <AuthGuard requiredRole={UserRole.SELLER}>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(hasAnyRole).toHaveBeenCalledWith([UserRole.SELLER]);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('merges requiredRoles and requiredRole into a single OR check', () => {
    const hasAnyRole = jest.fn(() => true);
    mockAuth({ isAuthenticated: true, isLoading: false, hasAnyRole });
    render(
      <AuthGuard requiredRoles={[UserRole.CUSTOMER]} requiredRole={UserRole.SELLER}>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(hasAnyRole).toHaveBeenCalledWith([UserRole.CUSTOMER, UserRole.SELLER]);
  });

  it('redirects to /unauthorized via replace (not push) when the role check fails, and does not render children', () => {
    const hasAnyRole = jest.fn(() => false);
    mockAuth({ isAuthenticated: true, isLoading: false, hasAnyRole });
    render(
      <AuthGuard requiredRole={UserRole.SELLER}>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('does not redirect or call login while still loading, regardless of role requirements', () => {
    mockAuth({ isLoading: true, isAuthenticated: false });
    render(
      <AuthGuard requiredRole={UserRole.SELLER}>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
