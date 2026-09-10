import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useInventoryUpdates } from '@/features/orders/hooks/use-order-updates';
import { wsClient } from '@/infrastructure/realtime/websocket-client';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/infrastructure/realtime/websocket-client', () => ({
  wsClient: {
    connect: jest.fn(),
    on: jest.fn(() => jest.fn()),
    isConnected: jest.fn(() => false),
    subscribeToOrder: jest.fn(),
    unsubscribeFromOrder: jest.fn(),
    subscribeToCart: jest.fn(),
    emit: jest.fn(),
  },
}));

const mockedUseSession = useSession as jest.Mock;
const mockedWsClient = wsClient as jest.Mocked<typeof wsClient>;

describe('useInventoryUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression: this hook never called wsClient.connect() itself, so it
  // silently received nothing unless some unrelated hook (e.g. an
  // order-tracking page open elsewhere) happened to have already connected
  // the shared socket first. It's now self-sufficient for any signed-in user.
  it('connects the WebSocket client for a signed-in user', () => {
    mockedUseSession.mockReturnValue({ data: { user: { id: 'user-1' } } });

    renderHook(() => useInventoryUpdates('55'));

    expect(mockedWsClient.connect).toHaveBeenCalledWith('user-1', expect.any(Function));
  });

  it('does not attempt to connect for a signed-out user', () => {
    mockedUseSession.mockReturnValue({ data: null });

    renderHook(() => useInventoryUpdates('55'));

    expect(mockedWsClient.connect).not.toHaveBeenCalled();
  });

  it('subscribes to the stock_changed event for the given product id', () => {
    mockedUseSession.mockReturnValue({ data: { user: { id: 'user-1' } } });

    renderHook(() => useInventoryUpdates('55'));

    expect(mockedWsClient.on).toHaveBeenCalledWith('product:55:stock_changed', expect.any(Function));
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockedWsClient.on.mockReturnValue(unsubscribe);
    mockedUseSession.mockReturnValue({ data: { user: { id: 'user-1' } } });

    const { unmount } = renderHook(() => useInventoryUpdates('55'));
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
