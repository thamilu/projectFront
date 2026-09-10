import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPopover } from '@/features/seller/components/layout/notification-popover';
import { useNotifications } from '@/features/notifications';
import { toast } from 'sonner';

// Mock Router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Sonner Toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Regression: this component previously read from a local-only Zustand
// store (useNotificationStore) whose fetchNotifications() seeded hardcoded
// fake notifications into localStorage. It now consumes the same real,
// backend-integrated useNotifications() hook HeaderNotificationButton uses —
// mocked here the same way HeaderNotificationButton.test.tsx mocks it.
jest.mock('@/features/notifications', () => ({
  useNotifications: jest.fn(),
}));

const mockedUseNotifications = useNotifications as jest.Mock;

// Mock ResizeObserver and scrollTo for Radix UI compatibility in JSDOM
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollTo = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

function mockNotifications(overrides: Partial<ReturnType<typeof useNotifications>> = {}) {
  const defaults: ReturnType<typeof useNotifications> = {
    notifications: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    markAsRead: jest.fn(),
    isMarkingAsRead: false,
    markAllAsRead: jest.fn(),
    isMarkingAllAsRead: false,
    deleteNotification: jest.fn(),
    isDeleting: false,
  };
  mockedUseNotifications.mockReturnValue({ ...defaults, ...overrides });
  return { ...defaults, ...overrides };
}

function buildNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    userId: 'user-1',
    type: 'order' as const,
    title: 'New Order',
    message: 'You have a new order',
    createdAt: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

describe('NotificationPopover Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotifications();
  });

  describe('Trigger Button', () => {
    it('should render trigger button with default label when unreadCount is 0', () => {
      render(<NotificationPopover />);
      const button = screen.getByRole('button', { name: 'Notifications, no unread' });
      expect(button).toBeInTheDocument();
    });

    it('should render correct label when unreadCount is 1', () => {
      mockNotifications({ notifications: [buildNotification()] });
      render(<NotificationPopover />);
      const button = screen.getByRole('button', { name: '1 unread notification, open notifications' });
      expect(button).toBeInTheDocument();
    });

    it('should render correct label when unreadCount is plural (e.g. 3)', () => {
      mockNotifications({
        notifications: [
          buildNotification({ id: '1', title: 'Order 1' }),
          buildNotification({ id: '2', title: 'Order 2' }),
          buildNotification({ id: '3', title: 'Payment 3', type: 'payment' }),
        ],
      });
      render(<NotificationPopover />);
      const button = screen.getByRole('button', { name: '3 unread notifications, open notifications' });
      expect(button).toBeInTheDocument();
    });

    it('should format unreadCount to "9+" when greater than 9', () => {
      const mockList = Array.from({ length: 12 }, (_, i) =>
        buildNotification({ id: String(i), title: `Notification ${i}` })
      );
      mockNotifications({ notifications: mockList });

      const { container } = render(<NotificationPopover />);
      const badge = container.querySelector('.bg-destructive');
      expect(badge).toHaveTextContent('9+');
      expect(badge).toHaveAttribute('aria-hidden', 'true');
    });

    it('should hide Bell icon from assistive technologies', () => {
      const { container } = render(<NotificationPopover />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not contain any custom sr-only span with notification descriptions inside trigger button', () => {
      render(<NotificationPopover />);
      const button = screen.getByRole('button');
      expect(button.textContent).not.toContain('new notifications');
      expect(button.textContent).not.toContain('No new notifications');
    });

    it('should have animate-pulse class on badge when popover is closed', () => {
      mockNotifications({ notifications: [buildNotification()] });
      const { container } = render(<NotificationPopover />);
      const badge = container.querySelector('.bg-destructive');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('should NOT have animate-pulse class on badge when popover is open', async () => {
      const user = userEvent.setup();
      mockNotifications({ notifications: [buildNotification()] });
      const { container } = render(<NotificationPopover />);
      const button = screen.getByRole('button');

      await user.click(button);

      const badge = container.querySelector('.bg-destructive');
      expect(badge).not.toHaveClass('animate-pulse');
    });
  });

  describe('Loading State', () => {
    it('should render 3 skeleton items when isLoading is true', async () => {
      const user = userEvent.setup();
      mockNotifications({ isLoading: true });

      render(<NotificationPopover />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const skeletonWrapper = screen.getByRole('status');
      expect(skeletonWrapper).toHaveAttribute('aria-label', 'Loading notifications');
      expect(skeletonWrapper).toHaveAttribute('aria-busy', 'true');

      const skeletons = skeletonWrapper.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);

      const listContainer = screen.getByRole('region', { name: 'Notifications list' });
      const itemButtons = listContainer.querySelectorAll('button');
      expect(itemButtons.length).toBe(0);
    });
  });

  describe('Error State', () => {
    it('should render error message and retry action when isError is true', async () => {
      const user = userEvent.setup();
      const mockRefetch = jest.fn();
      mockNotifications({ isError: true, refetch: mockRefetch });

      render(<NotificationPopover />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.getByText("Couldn't load notifications.")).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: 'Try again' });
      expect(retryBtn).toBeInTheDocument();

      await user.click(retryBtn);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Null Safety & Empty States', () => {
    it('should render "No notifications yet" when notifications array is empty', async () => {
      const user = userEvent.setup();
      mockNotifications({ notifications: [] });

      render(<NotificationPopover />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  describe('Notification Items', () => {
    it('should render each notification item as a button instead of div', async () => {
      const user = userEvent.setup();
      mockNotifications({
        notifications: [buildNotification({ id: '123', title: 'Order Completed', message: 'Order #412 has been successfully completed.' })],
      });

      render(<NotificationPopover />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const notifItem = screen.getByRole('button', { name: 'Order Completed - unread' });
      expect(notifItem).toBeInTheDocument();
      expect(notifItem.tagName).toBe('BUTTON');
      expect(notifItem).toHaveAttribute('type', 'button');
      expect(notifItem).toHaveAttribute('tabIndex', '0');
    });

    it('should display background modifiers and class structures correctly based on read status', async () => {
      const user = userEvent.setup();
      mockNotifications({
        notifications: [
          buildNotification({ id: '1', title: 'Unread Notification', read: false }),
          buildNotification({ id: '2', title: 'Read Notification', read: true }),
        ],
      });

      render(<NotificationPopover />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const unreadItem = screen.getByRole('button', { name: 'Unread Notification - unread' });
      const readItem = screen.getByRole('button', { name: 'Read Notification' });

      expect(unreadItem).toHaveClass('bg-muted');
      expect(readItem).not.toHaveClass('bg-muted');

      expect(unreadItem.querySelector('p')).toHaveClass('truncate');
      expect(unreadItem.querySelectorAll('p')[1]).toHaveClass('line-clamp-2');
      expect(unreadItem.querySelectorAll('p')[2]).toHaveClass('text-xs');
    });

    it('should mark as read but not navigate when actionUrl is undefined', async () => {
      const user = userEvent.setup();
      const mockMarkAsRead = jest.fn();
      mockNotifications({
        markAsRead: mockMarkAsRead,
        notifications: [buildNotification({ id: '99', title: 'Alert', message: 'Simple info alert' })],
      });

      render(<NotificationPopover />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: 'Alert - unread' }));

      expect(mockMarkAsRead).toHaveBeenCalledWith('99');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should mark as read and navigate when actionUrl is defined', async () => {
      const user = userEvent.setup();
      const mockMarkAsRead = jest.fn();
      mockNotifications({
        markAsRead: mockMarkAsRead,
        notifications: [
          buildNotification({
            id: '100',
            title: 'Order Link',
            message: 'Check out order #12',
            actionUrl: '/seller/orders/12',
          }),
        ],
      });

      render(<NotificationPopover />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: 'Order Link - unread' }));

      expect(mockMarkAsRead).toHaveBeenCalledWith('100');
      expect(mockPush).toHaveBeenCalledWith('/seller/orders/12');
    });
  });

  describe('Mark All As Read', () => {
    it('should call the hook and display toast notification when Mark All is clicked', async () => {
      const user = userEvent.setup();
      const mockMarkAll = jest.fn();
      mockNotifications({
        markAllAsRead: mockMarkAll,
        notifications: [buildNotification()],
      });

      render(<NotificationPopover />);
      await user.click(screen.getByRole('button'));

      const markBtn = screen.getByRole('button', { name: 'Mark all as read' });
      await user.click(markBtn);

      expect(mockMarkAll).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('All notifications marked as read');
    });
  });

  describe('View All Notifications', () => {
    it('should navigate to seller notifications on click', async () => {
      const user = userEvent.setup();
      mockNotifications({ notifications: [buildNotification()] });

      render(<NotificationPopover />);
      await user.click(screen.getByRole('button'));

      const viewAllBtn = screen.getByRole('button', { name: 'View all notifications' });
      await user.click(viewAllBtn);

      expect(mockPush).toHaveBeenCalledWith('/seller/notifications');
    });
  });

  describe('Popover Accessibility & Keyboard navigation', () => {
    it('should render content with aria-modal="true" and descriptive label', async () => {
      const user = userEvent.setup();
      render(<NotificationPopover />);
      await user.click(screen.getByRole('button'));

      const popoverContent = screen.getByLabelText('Notifications panel');
      expect(popoverContent).toBeInTheDocument();
      expect(popoverContent).toHaveAttribute('aria-modal', 'true');
    });
  });
});
