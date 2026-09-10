import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Local, client-only notification feed — distinct from the real,
 * backend-sourced notification system in `features/notifications/hooks/use-notifications.ts`
 * (used by HeaderNotificationButton and the seller NotificationPopover).
 *
 * This store exists for events that only ever happen client-side and have
 * no backend record of their own — currently just browser online/offline
 * transitions (see `useOfflineDetection` in `shared/hooks/use-app-integrations.ts`).
 * It is NOT a general-purpose notification center: anything with a real
 * backend source of truth (orders, payments, KYC, stock) belongs in the real
 * system above, not here.
 *
 * Previously this store also exposed `fetchNotifications()`, which — despite
 * the name — never called any API. It slept 800ms to simulate latency, then,
 * if the persisted list was empty, seeded three hardcoded notifications
 * ("New Order Received #ORD-92837", "Low Stock Alert: Nike Sneakers",
 * "KYC Identity Verified") into localStorage. Because of the `persist`
 * middleware, that fabricated data became permanent per-browser state that
 * never reflected a seller's real orders, inventory, or verification status.
 * The seller notification popover that rendered it has been migrated to the
 * real backend-integrated hook instead — see notification-popover.tsx.
 * `fetchNotifications`, its loading/error state, the read/delete/clear
 * actions, and the unrelated `notificationHelpers.sendPriceDropAlert` (a
 * client-only fabricator of the same kind, already disabled at its one call
 * site — see `usePriceMonitoring`'s comment in use-app-integrations.ts) were
 * removed as dead code once nothing genuine depended on them.
 */
interface LocalNotification {
  id: string;
  type: 'order' | 'payment' | 'wishlist' | 'security' | 'promotion';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationState {
  notifications: LocalNotification[];
  addNotification: (notification: Omit<LocalNotification, 'id' | 'timestamp'>) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: LocalNotification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));

        // Trigger browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            tag: newNotification.id,
          });
        }
      },
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);
