import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { notificationsApi } from '@/features/notifications/api/notifications-api';

jest.mock('@/features/notifications/api/notifications-api', () => ({
  notificationsApi: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  },
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockedNotificationsApi = notificationsApi as jest.Mocked<typeof notificationsApi>;
const mockedUseSession = useSession as jest.Mock;

function renderUseNotifications() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(() => useNotifications(), { wrapper });
}

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSession.mockReturnValue({ data: { user: { id: '1' } }, status: 'authenticated' });
  });

  // Regression guard: HeaderNotificationButton (the bell icon) calls
  // useNotifications() unconditionally in the header on every page,
  // including for guests — unlike useCart() and useWishlist(), which were
  // already fixed for this exact failure mode, this hook had no `enabled`
  // gate at all. A signed-out visitor triggered a guaranteed-403 request to
  // the authenticated-only /notifications endpoint on every single page
  // load, which the global axios interceptor surfaced as a visible
  // "Access Denied" toast for something the user never asked to do.
  it('does not call the notifications API when the user is unauthenticated', () => {
    mockedUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockedNotificationsApi.getNotifications.mockResolvedValue([]);

    const { result } = renderUseNotifications();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.notifications).toEqual([]);
    expect(mockedNotificationsApi.getNotifications).not.toHaveBeenCalled();
  });

  // Regression: getNotifications() previously returned the raw, un-unwrapped
  // axios response, pushing the burden of extracting the real array onto
  // consumer components. The API layer now normalizes it, so the hook (and
  // every consumer) always receives a plain array.
  it('fetches notifications when the user is authenticated', async () => {
    const payload = [
      {
        id: '1',
        userId: 'user-1',
        title: 'Order Shipped',
        message: 'Your order is on the way',
        read: false,
        type: 'shipping' as const,
        createdAt: new Date().toISOString(),
      },
    ];
    mockedNotificationsApi.getNotifications.mockResolvedValue(payload);

    const { result } = renderUseNotifications();

    await waitFor(() => expect(mockedNotificationsApi.getNotifications).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notifications).toEqual(payload);
  });

  it('surfaces a fetch failure via isError rather than throwing', async () => {
    mockedNotificationsApi.getNotifications.mockRejectedValue(new Error('network down'));

    const { result } = renderUseNotifications();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.notifications).toEqual([]);
  });
});
