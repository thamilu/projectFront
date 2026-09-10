/**
 * Notifications API
 * @module features/notifications/api/notifications-api
 */

import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import type { Notification } from '../types/notification.types';

export const notificationsApi = {
  /**
   * X-Bypass-Toast: ambient background read (header notification bell) —
   * not a user-initiated action. See wishlist-api.ts's getWishlist for the
   * full reasoning (same pattern, same failure mode).
   *
   * Response envelope isn't pinned to a shared contract (could be a raw
   * array, `{ content: [...] }`, or the `{ data: { content: [...] } }`
   * wrapper used elsewhere in this codebase) — normalized here so every
   * consumer gets a plain Notification[] regardless of which shape the API
   * actually returns. Previously this returned the raw, un-unwrapped axios
   * response, pushing the unwrapping burden onto one consumer component
   * (HeaderNotificationButton) via ad-hoc duck-typing.
   */
  getNotifications: async (): Promise<Notification[]> => {
    const { data: resp } = await apiClient.get<any>(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      headers: { 'X-Bypass-Toast': 'true' },
    });
    const content = resp?.data?.content ?? resp?.content ?? resp?.data ?? resp ?? [];
    return Array.isArray(content) ? content : [];
  },

  markAsRead: async (notificationId: string) => {
    return apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
  },

  markAllAsRead: async () => {
    return apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  deleteNotification: async (notificationId: string) => {
    return apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId));
  },
};
