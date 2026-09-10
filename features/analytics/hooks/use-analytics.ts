import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics-api';

export function useSellerAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'seller-stats'],
    queryFn: analyticsApi.getSellerAnalytics,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}
