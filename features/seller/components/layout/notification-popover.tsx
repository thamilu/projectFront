'use client';

import React, { memo, useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/atoms/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/atoms/popover';
import { useNotifications } from '@/features/notifications';
import { formatRelativeTime, formatBadgeCount, cn } from '@/shared/utils';

/**
 * Props for the NotificationPopover component.
 */
interface NotificationPopoverProps {}

/**
 * NotificationPopover - Displays the seller's real, backend-sourced alerts.
 *
 * Previously read from a local-only Zustand store (`useNotificationStore`)
 * whose `fetchNotifications()` seeded three hardcoded demo notifications
 * ("New Order Received", "Low Stock Alert", "KYC Identity Verified") into
 * localStorage on first load and never updated them again — a seller could
 * see a permanently-stale "New Order Received" notification indefinitely,
 * indistinguishable from a real one. Migrated to the same real,
 * backend-integrated `useNotifications()` hook the customer-facing header
 * bell (`HeaderNotificationButton`) already uses.
 */
export const NotificationPopover = memo(function NotificationPopover(
  _props: NotificationPopoverProps
): React.JSX.Element {
  const router = useRouter();

  // Controlled popover open state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const {
    notifications,
    isLoading,
    isError,
    refetch,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  // Derived state: calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Derived state: pre-format relative times to prevent recalculation overhead during render
  const formattedNotifications = useMemo(() => {
    return notifications.map((notif) => ({
      ...notif,
      relativeTime: formatRelativeTime(notif.createdAt),
    }));
  }, [notifications]);

  // Handle marking all items as read with confirmation feedback
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  }, [markAllAsRead]);

  // Handle clicking on an individual notification item
  const handleNotificationClick = useCallback(
    (id: string, actionUrl?: string) => {
      markAsRead(id);
      if (actionUrl) {
        router.push(actionUrl);
      }
    },
    [markAsRead, router]
  );

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted/50 focus-visible:ring-ring relative focus-visible:ring-2 h-11 w-11 rounded-full"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}, open notifications`
              : 'Notifications, no unread'
          }
          aria-haspopup="dialog"
        >
          <Bell className="h-5 w-5 transition-transform hover:scale-110" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground',
                !isPopoverOpen && 'animate-pulse'
              )}
              aria-hidden="true"
            >
              {formatBadgeCount(unreadCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-80"
        align="end"
        aria-label="Notifications panel"
        aria-modal="true"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary font-medium hover:bg-transparent"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto" role="region" aria-label="Notifications list">
            {isLoading ? (
              <div
                className="space-y-2"
                role="status"
                aria-label="Loading notifications"
                aria-busy="true"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg p-3 space-y-2 animate-pulse">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-2 bg-muted rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-destructive">Couldn&apos;t load notifications.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  className="text-xs h-8 px-3 rounded-lg"
                >
                  Try again
                </Button>
              </div>
            ) : formattedNotifications.length > 0 ? (
              formattedNotifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notif.id, notif.actionUrl)}
                  className={cn(
                    'w-full text-left rounded-lg p-3 text-sm transition-colors cursor-pointer block',
                    'hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                    !notif.read ? 'bg-muted font-medium' : ''
                  )}
                  aria-label={`${notif.title}${notif.read ? '' : ' - unread'}`}
                >
                  <p className="font-semibold text-foreground truncate">{notif.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs uppercase tracking-wider">
                    {notif.relativeTime}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">No notifications yet</p>
            )}
          </div>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              className="w-full text-xs font-semibold h-9 rounded-xl"
              size="sm"
              onClick={() => router.push('/seller/notifications')}
            >
              View all notifications
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

NotificationPopover.displayName = 'NotificationPopover';
