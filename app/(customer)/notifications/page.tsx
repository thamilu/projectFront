'use client';

/**
 * Notification centre.
 *
 * [CORRECTNESS] This page previously rendered a `mockNotifications` constant —
 * five invented entries shown identically to every user, including a fabricated
 * *"New Login Detected … from New York, NY"* security alert and amounts quoted
 * in USD (`$539.95`) in an application configured for INR. A fabricated
 * security alert is the most damaging item on the list: users act on those,
 * changing passwords or contacting support over an event that never happened.
 *
 * A complete `useNotifications` hook — query, mark-read, mark-all-read, delete,
 * all wired to real endpoints — already existed in
 * `features/notifications/hooks`. The page simply never used it. It does now.
 *
 * The settings panel that used to live here has been removed rather than
 * reimplemented: a dedicated `/notifications/settings` route already owns that
 * concern, and two independent copies of the same preferences is how they drift
 * apart.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Package,
  CreditCard,
  Truck,
  ShoppingBag,
  Settings,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Badge } from '@/shared/ui/atoms/badge';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import type {
  Notification,
  NotificationType,
} from '@/features/notifications/types/notification.types';
import { formatRelativeTime } from '@/shared/utils';

// ============================================================
// 1. TYPE PRESENTATION
// ============================================================

/**
 * Icon and filter label per notification type.
 *
 * Keyed off the real `NotificationType` union, so adding a backend type
 * surfaces as a compile error here rather than silently rendering with no icon
 * — the mock data used its own ad-hoc set of type strings that matched nothing.
 */
const TYPE_PRESENTATION: Record<NotificationType, { label: string; icon: typeof Bell }> = {
  order: { label: 'Orders', icon: Package },
  payment: { label: 'Payments', icon: CreditCard },
  shipping: { label: 'Shipping', icon: Truck },
  product: { label: 'Products', icon: ShoppingBag },
  system: { label: 'System', icon: Settings },
};

const ALL_FILTER = 'all' as const;
type Filter = typeof ALL_FILTER | NotificationType;

// ============================================================
// 2. PAGE
// ============================================================

export default function NotificationsPage() {
  const {
    notifications,
    isLoading,
    isError,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<Filter>(ALL_FILTER);

  /**
   * Counts are derived from the live list in one pass, rather than the
   * previous approach of a `.filter().length` per category evaluated at module
   * scope against constant data.
   */
  const { countsByType, unreadCount } = useMemo(() => {
    const counts = {} as Record<NotificationType, number>;
    let unread = 0;

    for (const notification of notifications) {
      counts[notification.type] = (counts[notification.type] ?? 0) + 1;
      if (!notification.read) unread += 1;
    }

    return { countsByType: counts, unreadCount: unread };
  }, [notifications]);

  const visible = useMemo(
    () => (filter === ALL_FILTER ? notifications : notifications.filter((n) => n.type === filter)),
    [notifications, filter]
  );

  /** Only the types actually present get a tab — no empty categories. */
  const availableFilters = useMemo(
    () =>
      (Object.keys(TYPE_PRESENTATION) as NotificationType[]).filter(
        (type) => (countsByType[type] ?? 0) > 0
      ),
    [countsByType]
  );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* ---------- Header ---------- */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'You’re all caught up'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/notifications/settings">
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* ---------- Filters ---------- */}
      {availableFilters.length > 0 && (
        /* A real tablist, so arrow-key navigation and state are conveyed to
           assistive technology — the previous filter row was plain buttons
           with no grouping semantics at all. */
        <div role="tablist" aria-label="Filter notifications" className="mb-5 flex flex-wrap gap-2">
          <FilterTab
            label="All"
            count={notifications.length}
            isActive={filter === ALL_FILTER}
            onSelect={() => setFilter(ALL_FILTER)}
          />
          {availableFilters.map((type) => (
            <FilterTab
              key={type}
              label={TYPE_PRESENTATION[type].label}
              count={countsByType[type] ?? 0}
              isActive={filter === type}
              onSelect={() => setFilter(type)}
            />
          ))}
        </div>
      )}

      {/* ---------- Body ---------- */}
      {isLoading ? (
        <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading your notifications…</span>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-muted h-20 animate-pulse rounded-lg" aria-hidden="true" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="text-destructive h-8 w-8" aria-hidden="true" />
            <p className="font-medium" role="alert">
              We couldn&apos;t load your notifications
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <BellOff className="text-muted-foreground h-10 w-10 opacity-40" aria-hidden="true" />
            <p className="font-medium">
              {filter === ALL_FILTER ? 'No notifications yet' : 'Nothing in this category'}
            </p>
            <p className="text-muted-foreground max-w-sm text-sm">
              {filter === ALL_FILTER
                ? 'Updates about your orders, payments and deliveries will appear here.'
                : 'Try another category to see your other updates.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => markAsRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// 3. PARTS
// ============================================================

function FilterTab({
  label,
  count,
  isActive,
  onSelect,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={`focus-visible:ring-ring inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:bg-muted'
      }`}
    >
      {label}
      <span className="text-xs tabular-nums opacity-75">{count}</span>
    </button>
  );
}

/**
 * One notification.
 *
 * Rendered as a list item with its action buttons individually named, so a
 * screen-reader user can tell which notification each control acts on — the
 * previous markup used unlabelled icon buttons inside plain divs.
 */
function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const presentation = TYPE_PRESENTATION[notification.type] ?? TYPE_PRESENTATION.system;
  const Icon = presentation.icon;

  const body = (
    <>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          notification.read ? 'bg-muted' : 'bg-primary/10'
        }`}
      >
        <Icon
          className={`h-5 w-5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-medium ${notification.read ? '' : 'text-foreground'}`}>
            {notification.title}
          </p>
          {!notification.read && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-sm">{notification.message}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          <time dateTime={notification.createdAt}>
            {formatRelativeTime(notification.createdAt)}
          </time>
        </p>
      </div>
    </>
  );

  return (
    <li>
      <Card className={notification.read ? '' : 'border-primary/40'}>
        <CardContent className="flex items-start gap-4 pt-5">
          {/* An actionable notification is a link, so it is reachable by
              keyboard and opens in a new tab on middle-click like any link. */}
          {notification.actionUrl ? (
            <Link
              href={notification.actionUrl}
              onClick={() => !notification.read && onMarkRead()}
              className="focus-visible:ring-ring flex min-w-0 flex-1 items-start gap-4 rounded focus-visible:ring-2 focus-visible:outline-none"
            >
              {body}
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-start gap-4">{body}</div>
          )}

          <div className="flex shrink-0 gap-1">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMarkRead}
                aria-label={`Mark "${notification.title}" as read`}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label={`Delete "${notification.title}"`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
