/**
 * Notifications Hook
 * @module features/notifications/hooks/use-notifications
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { notificationsApi } from '../api/notifications-api';

const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // The notifications endpoint is authenticated-only, but HeaderNotificationButton
  // (the bell icon) renders in the header on every page for every visitor,
  // guest or not. Without `enabled` here, a guest triggers a guaranteed-403
  // request on every single page load, which the global axios interceptor
  // (core/interceptors/index.ts) turns into a visible "Access Denied" toast
  // for something the user never asked to do — the same failure mode
  // useCart() and useWishlist() were already fixed for; this hook was missed.
  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: notificationsApi.getNotifications,
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  return {
    notifications: notifications ?? [],
    isLoading,
    isError,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    deleteNotification: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
