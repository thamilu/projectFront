import { useEffect, useCallback } from 'react';
import { useNotificationStore, notificationHelpers } from '@/store/notification-store';
import { useAnalyticsStore } from '@/store/analytics-store';
import { useWishlistStore } from '@/store/wishlist-store';

// Service Worker registration hook
export function useServiceWorker() {
  useEffect(() => {
    // Disabled to prevent PWA errors - re-enable when PWA assets are ready
    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker.register('/sw.js')
    //     .then((registration) => {
    //       console.log('SW registered: ', registration);
    //     })
    //     .catch((registrationError) => {
    //       console.log('SW registration failed: ', registrationError);
    //     });
    // }
  }, []);
}

// Notification permission hook
export function useNotificationPermission() {
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    // Disabled to prevent notification permission errors
    // Request notification permission on first visit
    // notificationHelpers.requestPermission().then((granted) => {
    //   if (granted) {
    //     addNotification({
    //       type: 'security',
    //       title: 'Notifications Enabled',
    //       message: 'You will now receive important updates and alerts.',
    //       read: false
    //     });
    //   }
    // });
  }, [addNotification]);
}

// Offline detection hook
export function useOfflineDetection() {
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    const handleOnline = () => {
      addNotification({
        type: 'security',
        title: 'Connection Restored',
        message: 'You are back online. Syncing data...',
        read: false
      });
    };

    const handleOffline = () => {
      addNotification({
        type: 'security',
        title: 'Connection Lost',
        message: 'You are offline. Some features may be limited.',
        read: false
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

// Price monitoring hook
export function usePriceMonitoring() {
  // Select the getter function from the store (stable reference)
  const getPriceDropItems = useWishlistStore(state => state.getPriceDropItems);

  useEffect(() => {
    // Simulate price monitoring (in real app, this would be server-side)
    const interval = setInterval(() => {
      const wishlistItems = getPriceDropItems();
      wishlistItems.forEach(item => {
        // Simulate random price drops
        if (Math.random() < 0.1) { // 10% chance
          const newPrice = item.price * (0.8 + Math.random() * 0.15); // 5-20% discount
          notificationHelpers.sendPriceDropAlert(item.name, item.price, newPrice);
        }
      });
    }, 60000 * 5); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [getPriceDropItems]);
}

// Analytics tracking hook
export function useAnalyticsTracking() {
  const addOrder = useAnalyticsStore(state => state.addOrder);

  // This would integrate with actual purchase events
  const trackPurchase = useCallback((amount: number, category: string) => {
    addOrder(amount, category);
  }, [addOrder]);

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