import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'wishlist' | 'security' | 'promotion';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationSettings {
  email: {
    orders: boolean;
    payments: boolean;
    wishlist: boolean;
    promotions: boolean;
    security: boolean;
  };
  push: {
    orders: boolean;
    payments: boolean;
    wishlist: boolean;
    promotions: boolean;
    security: boolean;
  };
  sms: {
    orders: boolean;
    payments: boolean;
    wishlist: boolean;
    promotions: boolean;
    security: boolean;
  };
  frequency: {
    email: 'instant' | 'daily' | 'weekly';
    priceDrops: 'instant' | 'daily' | 'weekly';
  };
}

interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  isLoading: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Computed
  getUnreadCount: () => number;
  getNotificationsByType: (type: string) => Notification[];
}

const defaultSettings: NotificationSettings = {
  email: {
    orders: true,
    payments: true,
    wishlist: true,
    promotions: false,
    security: true
  },
  push: {
    orders: true,
    payments: true,
    wishlist: false,
    promotions: false,
    security: true
  },
  sms: {
    orders: false,
    payments: true,
    wishlist: false,
    promotions: false,
    security: true
  },
  frequency: {
    email: 'instant',
    priceDrops: 'daily'
  }
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      settings: defaultSettings,
      isLoading: false,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications]
        }));

        // Trigger browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icon-192x192.png',
            tag: newNotification.id
          });
        }
      },

      markAsRead: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        }));
      },

      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notification => ({ ...notification, read: true }))
        }));
      },

      deleteNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(notification => notification.id !== id)
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      getUnreadCount: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.read).length;
      },

      getNotificationsByType: (type: string) => {
        const { notifications } = get();
        return type === 'all' 
          ? notifications 
          : notifications.filter(n => n.type === type);
      }
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({ 
        notifications: state.notifications,
        settings: state.settings 
      })
    }
  )
);

// Notification helpers
export const notificationHelpers = {
  requestPermission: async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  scheduleNotification: (title: string, body: string, delay: number) => {
    setTimeout(() => {
      useNotificationStore.getState().addNotification({
        type: 'promotion',
        title,
        message: body,
        read: false
      });
    }, delay);
  },

  sendPriceDropAlert: (productName: string, oldPrice: number, newPrice: number) => {
    const savings = oldPrice - newPrice;
    const percentage = Math.round((savings / oldPrice) * 100);
    
    useNotificationStore.getState().addNotification({
      type: 'wishlist',
      title: 'Price Drop Alert! 🔥',
      message: `${productName} is now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)}) - Save ${percentage}%!`,
      read: false,
      actionUrl: '/wishlist'
    });
  }
};