import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics-api';
import { queryKeys } from '@/core/cache/query-keys';

export function useAnalyticsStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard-stats'],
    queryFn: analyticsApi.getDashboardStats,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}
