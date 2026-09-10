import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { logger } from '@/core/telemetry/logger';

// Service Worker registration hook.
// Intentional no-op: re-enable once real PWA assets (sw.js, manifest icons)
// exist — registering against a missing sw.js throws in the browser console
// on every page load.
export function useServiceWorker() {
  useEffect(() => {}, []);
}

// Notification permission hook.
// Intentional no-op: requesting the browser Notification permission on
// first visit is disruptive UX without a real opt-in moment driving it —
// wire this to an explicit user action (e.g. a "notify me" toggle) instead
// of firing it unconditionally on mount.
export function useNotificationPermission() {
  useEffect(() => {}, []);
}

// Offline detection hook
export function useOfflineDetection() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const handleOnline = () => {
      addNotification({
        type: 'security',
        title: 'Connection Restored',
        message: 'You are back online. Syncing data...',
        read: false,
      });
    };

    const handleOffline = () => {
      addNotification({
        type: 'security',
        title: 'Connection Lost',
        message: 'You are offline. Some features may be limited.',
        read: false,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);
}

// Price monitoring hook.
// Intentional no-op: this previously fabricated random price drops
// client-side (Math.random() chance + a randomly discounted fake price) and
// pushed them through the real notification UI, indistinguishable from a
// genuine price-drop alert. Real price-drop monitoring needs a backend
// endpoint tracking actual price history — build that as a deliberate
// feature rather than re-enabling client-side randomization.
export function usePriceMonitoring() {}

// Analytics tracking hook.
//
// Bridges the legacy/external "trackPurchase" call — see
// core/providers/app-integrations-initializer.tsx, which exposes this on
// window.trackPurchase / window.__legacy.trackPurchase for third-party
// pixel compatibility — into this app's own structured logging.
//
// Previously this fed features/analytics/store/analytics-store.ts's
// spending/budget/category tracking, a persisted Zustand store confirmed
// (full-codebase search) to have zero UI consumers anywhere — every field
// it computed was written to localStorage and never read back by any
// component. That store has been deleted. Logging here is the honest
// replacement: a real, observable, production-traceable side effect
// instead of silently accumulating data nothing in this app ever displays.
// If a genuine customer-facing spending/budget feature is built later, back
// it with real order history (see features/orders), not client-only
// accumulation seeded solely by this external bridge.
export function useAnalyticsTracking() {
  const trackPurchase = useCallback((amount: number, category: string) => {
    logger.info('[Analytics] Purchase tracked via legacy integration bridge', {
      amount,
      category,
    });
  }, []);

  return { trackPurchase };
}

// Combined app hooks
export function useAppIntegrations() {
  useServiceWorker();
  useNotificationPermission();
  useOfflineDetection();
  usePriceMonitoring();

  return useAnalyticsTracking();
}
