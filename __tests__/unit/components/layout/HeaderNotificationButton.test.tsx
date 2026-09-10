import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderNotificationButton } from '@/shared/ui/layout/header/parts/header-notification-button';
import { useNotifications } from '@/features/notifications';

jest.mock('@/features/notifications', () => ({
  useNotifications: jest.fn(),
}));

describe('HeaderNotificationButton Component', () => {
  const mockMarkAsRead = jest.fn();
  const mockMarkAllAsRead = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification button with no badge when unread count is 0', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        { id: '1', title: 'Order Delivered', message: 'Your order was delivered', read: true, type: 'order' },
      ],
      isLoading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<HeaderNotificationButton />);

    const button = screen.getByRole('button', { name: /notifications\. no unread notifications/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('displays badge count when unread notifications exist', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        { id: '1', title: 'Payment Received', message: 'Invoice #1024 paid', read: false, type: 'payment' },
        { id: '2', title: 'Order Shipped', message: 'Package in transit', read: false, type: 'shipping' },
      ],
      isLoading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<HeaderNotificationButton />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens popover on click and lists notifications with category icons', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        { id: '1', title: 'Payment Received', message: 'Invoice #1024 paid', read: false, type: 'payment' },
      ],
      isLoading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<HeaderNotificationButton />);

    const trigger = screen.getByRole('button', { name: /2 unread notifications|1 unread notifications|notifications/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /notifications popover/i })).toBeInTheDocument();
    expect(screen.getByText('Payment Received')).toBeInTheDocument();
    expect(screen.getByText('Invoice #1024 paid')).toBeInTheDocument();
  });

  it('triggers markAllAsRead when "Mark all read" button is clicked', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        { id: '1', title: 'Security Alert', message: 'New login detected', read: false, type: 'security' },
      ],
      isLoading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<HeaderNotificationButton />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const markAllBtn = screen.getByText(/mark all read/i);
    fireEvent.click(markAllBtn);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('closes popover on Escape keydown', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      isLoading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
    });

    render(<HeaderNotificationButton />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
