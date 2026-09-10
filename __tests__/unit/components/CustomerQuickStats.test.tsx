import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CustomerQuickStats } from '@/features/customer/components/CustomerQuickStats';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/core/client';
import { logger } from '@/core/telemetry/logger';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/core/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('@/core/telemetry/logger', () => ({
  logger: { error: jest.fn() },
}));

describe('CustomerQuickStats Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders loading state initially with static categories and no active order', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { accessToken: 'mock-token' },
      status: 'authenticated',
    });

    // Return a promise that does not resolve immediately
    (apiClient.get as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<CustomerQuickStats userId="user-123" userName="Alice Smith" />);

    // Quick Categories should render immediately
    expect(screen.getByText('Quick Categories')).toBeInTheDocument();
    // Active order card should not render initially while loading
    expect(screen.queryByText('Tracking Order')).not.toBeInTheDocument();
  });

  it('renders active order tracking card when active order is present', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { accessToken: 'mock-token' },
      status: 'authenticated',
    });

    const mockDashboardData = {
      accountInfo: { totalOrders: 5 },
      cartInfo: { itemCount: 2, totalValue: 45.99 },
      wishlistInfo: { itemCount: 8 },
      rewardPoints: 150,
      activeOrder: {
        id: 'order-1',
        orderNumber: 'ESHOP-12345',
        status: 'SHIPPED',
        estimatedDelivery: '2026-06-01',
        items: [{ productName: 'Premium Headphones' }],
      },
    };

    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: mockDashboardData },
    });

    render(<CustomerQuickStats userId="user-123" userName="Alice Smith" />);

    await waitFor(() => {
      expect(screen.getByText('#ESHOP-12345')).toBeInTheDocument();
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Premium Headphones')).toBeInTheDocument();
      expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    });
  });

  // Regression guard: a failed fetch here used to go through raw
  // console.error(error) — Next.js's dev overlay intercepts any
  // console.error call carrying a real Error instance and renders it as a
  // full-screen crash report, even though this failure is fully handled
  // (the order-tracking banner just doesn't render; Quick Categories still
  // does). logger.error routes through console.log internally, which the
  // dev overlay never intercepts.
  it('degrades gracefully and logs via the structured logger (not console.error) when the fetch fails', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { accessToken: 'mock-token' },
      status: 'authenticated',
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network down'));

    render(<CustomerQuickStats userId="user-123" userName="Alice Smith" />);

    await waitFor(() => expect(logger.error).toHaveBeenCalled());

    expect(screen.getByText('Quick Categories')).toBeInTheDocument();
    expect(screen.queryByText('Tracking Order')).not.toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
