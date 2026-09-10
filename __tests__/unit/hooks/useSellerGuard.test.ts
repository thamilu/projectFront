import { renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { sellerApi } from '@/features/seller/api/seller-api';
import { getHttpStatus } from '@/shared/utils/error-utils';
import { useSellerGuard } from '@/features/seller/hooks/useSellerGuard';
import { APP_ROUTES } from '@/shared/routes';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { info: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/features/seller/api/seller-api', () => ({
  sellerApi: { getMyProfile: jest.fn() },
}));

jest.mock('@/shared/utils/logger', () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/shared/utils/error-utils', () => ({
  getHttpStatus: jest.fn(),
}));

const mockPush = jest.fn();
const mockGetMyProfile = sellerApi.getMyProfile as jest.Mock;
const mockSignIn = signIn as jest.Mock;
const mockGetHttpStatus = getHttpStatus as jest.Mock;

function setup(params: Partial<Parameters<typeof useSellerGuard>[0]> = {}) {
  return renderHook(() =>
    useSellerGuard({
      isAuthLoading: false,
      isAuthenticated: true,
      roles: [],
      isOnboardPath: false,
      pathname: '/seller/dashboard',
      ...params,
    })
  );
}

describe('useSellerGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('reports isSeller true when the SELLER role is present (case-insensitive) and does nothing else', async () => {
    const { result } = setup({ roles: ['seller'] });
    expect(result.current.isSeller).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it('redirects to login when not authenticated', async () => {
    setup({ isAuthenticated: false });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.AUTH_LOGIN));
  });

  it('does nothing while auth is still loading', async () => {
    setup({ isAuthLoading: true, roles: [] });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it('skips guard checks entirely on the onboarding path', async () => {
    setup({ isOnboardPath: true, roles: [] });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockGetMyProfile).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('skips guard checks outside the /seller path', async () => {
    setup({ pathname: '/dashboard', roles: [] });
    await new Promise((r) => setTimeout(r, 0));
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it('refreshes the session and shows success when the backend profile is already ACTIVE', async () => {
    mockGetMyProfile.mockResolvedValue({ status: 'ACTIVE' });
    mockSignIn.mockResolvedValue({ error: undefined });

    setup({ roles: [] });

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Session updated. Welcome back!'));
    expect(mockPush).not.toHaveBeenCalledWith(APP_ROUTES.AUTH_LOGIN);
  });

  it('sends the user to login when the ACTIVE-profile session refresh itself fails', async () => {
    mockGetMyProfile.mockResolvedValue({ status: 'ACTIVE' });
    mockSignIn.mockResolvedValue({ error: 'RefreshFailed' });

    setup({ roles: [] });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.AUTH_LOGIN));
    expect(toast.error).toHaveBeenCalledWith('Session refresh failed. Please sign in again.');
  });

  it('redirects to seller registration when no active backend profile exists', async () => {
    mockGetMyProfile.mockResolvedValue({ status: 'PENDING' });

    setup({ roles: [] });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.SELLER.REGISTER));
  });

  it('attempts one role-sync sign-in on a 403 from the profile check', async () => {
    mockGetMyProfile.mockRejectedValue(new Error('forbidden'));
    mockGetHttpStatus.mockReturnValue(403);
    mockSignIn.mockResolvedValue({ error: undefined });

    setup({ roles: [], pathname: '/seller/dashboard' });

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith('keycloak', { callbackUrl: '/seller/dashboard' })
    );
    expect(toast.info).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalledWith(APP_ROUTES.SELLER.REGISTER);
  });

  it('redirects to registration for a non-403 profile-check failure', async () => {
    mockGetMyProfile.mockRejectedValue(new Error('server error'));
    mockGetHttpStatus.mockReturnValue(500);

    setup({ roles: [] });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(APP_ROUTES.SELLER.REGISTER));
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('silently ignores an AbortError from an in-flight profile check', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockGetMyProfile.mockRejectedValue(abortError);

    setup({ roles: [] });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockPush).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
