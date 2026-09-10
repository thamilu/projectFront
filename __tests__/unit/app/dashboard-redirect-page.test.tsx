import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardRedirectPage from '@/app/(customer)/dashboard/page';
import { useAuth } from '@/domains/auth/hooks/use-auth';
import { APP_ROUTES } from '@/shared/routes';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/domains/auth/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

const mockReplace = jest.fn();

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    isSeller: false,
    isDeliveryAgent: false,
    ...overrides,
  });
}

// Regression: this page previously read `(session as any).roles` from raw
// useSession() with an unchecked `any` cast, bypassing mapUserRole()'s
// allowlist that every other role check in the app goes through. It now
// uses useAuth()'s validated isSeller/isDeliveryAgent, the same source of
// truth as AuthGuard, LoginButton, and everywhere else.
describe('DashboardRedirectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  it('does nothing while auth state is still loading', () => {
    mockAuth({ isLoading: true, isAuthenticated: false });
    render(<DashboardRedirectPage />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user to login', () => {
    mockAuth({ isAuthenticated: false });
    render(<DashboardRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith(APP_ROUTES.AUTH_LOGIN);
  });

  it('redirects a seller to the seller dashboard', () => {
    mockAuth({ isSeller: true });
    render(<DashboardRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith(APP_ROUTES.SELLER.DASHBOARD);
  });

  it('redirects a delivery agent to the delivery dashboard', () => {
    mockAuth({ isDeliveryAgent: true });
    render(<DashboardRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith(APP_ROUTES.DELIVERY.DASHBOARD);
  });

  it('redirects a plain customer to home', () => {
    mockAuth();
    render(<DashboardRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith(APP_ROUTES.HOME);
  });

  it('prioritizes seller over delivery agent when a user has both roles', () => {
    mockAuth({ isSeller: true, isDeliveryAgent: true });
    render(<DashboardRedirectPage />);
    expect(mockReplace).toHaveBeenCalledWith(APP_ROUTES.SELLER.DASHBOARD);
  });
});
