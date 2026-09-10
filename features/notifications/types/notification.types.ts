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
  /** ISO 8601 timestamp string, as received over JSON — never a real `Date`
   * instance, since `notificationsApi.getNotifications` returns the API
   * response directly with no date-parsing step. */
  createdAt: string;
}
