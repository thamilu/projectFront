/**
 * Notifications API
 * @module features/notifications/api/notifications-api
 */

import apiClient from '@/lib/axios';

export const notificationsApi = {
  // TODO: Implement notifications API methods
  getNotifications: async () => {
    return apiClient.get('/notifications');
  },
  
  markAsRead: async (notificationId: string) => {
    return apiClient.patch(`/notifications/${notificationId}/read`);
  },
  
  markAllAsRead: async () => {
    return apiClient.patch('/notifications/read-all');
  },
  
  deleteNotification: async (notificationId: string) => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },
};
