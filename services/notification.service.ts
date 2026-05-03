/**
 * Notification Service
 * Handles in-app notifications
 */

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export class NotificationService {
  private notifications: Notification[] = [];

  async getNotifications(): Promise<Notification[]> {
    return this.notifications;
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    this.notifications.push({
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date(),
    });
  }
}

export const notificationService = new NotificationService();
