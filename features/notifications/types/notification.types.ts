/**
 * Notification Types
 */

export type NotificationType = 'order' | 'payment' | 'shipping' | 'product' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}
