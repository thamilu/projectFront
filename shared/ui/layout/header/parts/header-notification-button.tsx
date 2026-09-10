'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  Truck,
  Shield,
  Info,
  BellOff,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { useNotifications, type Notification } from '@/features/notifications';
import { cn } from '@/shared/utils';

function getCategoryIcon(type: string) {
  switch (type) {
    case 'order':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-emerald-500" />;
    case 'shipping':
      return <Truck className="h-4 w-4 text-amber-500" />;
    case 'system':
    case 'security':
      return <Shield className="h-4 w-4 text-purple-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

export const HeaderNotificationButton = React.memo(function HeaderNotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const unreadCount = useMemo(() => {
    return notifications.filter((n: Notification) => !n.read).length;
  }, [notifications]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Escape key closes and restores focus
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [isOpen]
  );

  // Non-modal dialog per WCAG: background stays interactive (outside-click
  // already closes it), but opening it must still move focus in — this was
  // previously missing, leaving keyboard users to Tab from wherever they
  // already were instead of landing inside the newly-opened panel.
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef} onKeyDown={handleKeyDown}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications. Click to view.`
            : 'Notifications. No unread notifications.'
        }
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-9 w-9 rounded-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5 text-foreground" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Feed */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications popover"
          tabIndex={-1}
          className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-xl border border-border/80 bg-popover/95 shadow-xl backdrop-blur-md animate-in fade-in-50 slide-in-from-top-2 focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead?.()}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-2">
                  <BellOff className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You are all caught up! Updates will appear here.
                </p>
              </div>
            ) : (
              notifications.slice(0, 5).map((item: Notification) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.read) markAsRead?.(item.id);
                  }}
                  aria-label={
                    item.read
                      ? `${item.title}. ${item.message}`
                      : `Unread: ${item.title}. ${item.message}. Activate to mark as read.`
                  }
                  className={cn(
                    'group flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                    !item.read && 'bg-primary/5'
                  )}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    {getCategoryIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                      {!item.read && (
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 p-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span>View All Notifications</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});
