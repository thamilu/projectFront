import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useProfileData, profileCacheService } from '@/features/users/hooks/useProfileData';
import { apiClient } from '@/core/client';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock apiClient
jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('useProfileData abort reference counting', () => {
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    profileCacheService.invalidate();
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { id: 'user-123', name: 'John Doe', email: 'john@example.com', roles: ['USER'] },
      },
      status: 'authenticated',
    });
  });

  it('resolves deduplicated parallel fetches when one is aborted', async () => {
    let resolveRequest: (value: any) => void = () => {};
    const requestPromise = new Promise((resolve) => {
      resolveRequest = resolve;
    });

    // Mock api response
    (apiClient.get as jest.Mock).mockReturnValue(requestPromise);

    // Call hook instance 1
    const { result: hook1, unmount: unmount1 } = renderHook(() =>
      useProfileData(mockReset, { userId: 'user-123' })
    );

    // Call hook instance 2
    const { result: hook2 } = renderHook(() => useProfileData(mockReset, { userId: 'user-123' }));

    // Both should be in loading state
    expect(hook1.current.isLoading).toBe(true);
    expect(hook2.current.isLoading).toBe(true);

    // Unmount hook 1 (this triggers AbortController.abort() for hook 1)
    unmount1();

    // Hook 2 should STILL be loading (not aborted, since Hook 2's signal is active)
    expect(hook2.current.isLoading).toBe(true);
    expect(hook2.current.error).toBeNull();

    // Resolve the mock network request
    const mockApiResponse = {
      data: {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          gender: 'Male',
          preferredLanguage: 'es',
        },
      },
    };

    await act(async () => {
      resolveRequest(mockApiResponse);
    });

    // Verify Hook 2 completes successfully
    await waitFor(() => {
      expect(hook2.current.isLoading).toBe(false);
      expect(hook2.current.status).toBe('success');
      expect(hook2.current.error).toBeNull();
    });

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        gender: 'MALE',
        preferredLanguage: 'es',
      })
    );
  });

  it('exposes accountMeta (createdAt/emailVerified/sellerStatus) from the raw fetch — fields ProfileHeader needs that normalizeProfileData drops since they are not form fields', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          firstName: 'Priya',
          lastName: 'Shah',
          email: 'priya@example.com',
          createdAt: '2023-06-01T00:00:00Z',
          emailVerified: true,
          status: 'UNDER_REVIEW', // present when the fetched profile is a seller profile
        },
      },
    });

    const { result } = renderHook(() => useProfileData(mockReset, { userId: 'user-789' }));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.accountMeta).toEqual({
      createdAt: '2023-06-01T00:00:00Z',
      emailVerified: true,
      sellerStatus: 'UNDER_REVIEW',
    });
  });

  it('leaves accountMeta fields undefined (not fabricated) when the backend response omits them', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: { firstName: 'Priya', lastName: 'Shah', email: 'priya@example.com' } },
    });

    const { result } = renderHook(() => useProfileData(mockReset, { userId: 'user-999' }));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.accountMeta).toEqual({
      createdAt: undefined,
      emailVerified: undefined,
      sellerStatus: undefined,
    });
  });

  it('correctly normalizes different gender string formats and fallback preferredLanguage', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          gender: 'Female',
        },
      },
    });

    const { result } = renderHook(() => useProfileData(mockReset, { userId: 'user-456' }));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(mockReset).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        gender: 'FEMALE',
        preferredLanguage: 'en', // base default code
      })
    );
  });
});
