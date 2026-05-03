'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { AdminDashboardData, DateRange } from '@/types/dashboard';
import { safeFetch } from '@/lib/utils/fetch-utils';
import { handleError } from '@/lib/utils/error-utils';
import type { ApiError } from '@/types/api';

interface UseAdminDashboardOptions {
  dateRange?: DateRange;
  refreshInterval?: number;
  enabled?: boolean;
}

interface UseAdminDashboardReturn {
  data: AdminDashboardData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: ApiError | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

async function fetchDashboardData(dateRange?: DateRange): Promise<AdminDashboardData> {
  const params = new URLSearchParams();

  if (dateRange) {
    params.set('from', dateRange.from.toISOString());
    params.set('to', dateRange.to.toISOString());
    if (dateRange.preset) {
      params.set('preset', dateRange.preset);
    }
  }

  const url = `/api/v1/dashboard/admin${params.toString() ? `?${params}` : ''}`;
  try {
    const data = await safeFetch<unknown>(url, { credentials: 'include' });
    const payload = data as { data?: AdminDashboardData } | AdminDashboardData;
    return (payload as { data?: AdminDashboardData }).data || (payload as AdminDashboardData);
  } catch (err) {
    handleError(err, '[Admin Dashboard] Fetch failed');
    throw err as ApiError;
  }
}

export function useAdminDashboard(options: UseAdminDashboardOptions = {}): UseAdminDashboardReturn {
  const {
    dateRange,
    refreshInterval = 30000, // 30 seconds
    enabled = true,
  } = options;

  const queryClient = useQueryClient();

  // Create stable query key
  const queryKey = useMemo(
    () => ['admin-dashboard', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    [dateRange]
  );

  const query = useQuery<AdminDashboardData, ApiError>({
    queryKey,
    queryFn: () => fetchDashboardData(dateRange),
    enabled,
    refetchInterval: refreshInterval,
    staleTime: 10000, // 10 seconds
    gcTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.code === 'UNAUTHORIZED' || error.code === 'FORBIDDEN') {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  }, [queryClient]);

  const lastUpdated = useMemo(() => {
    if (query.data?.lastUpdated) {
      return new Date(query.data.lastUpdated);
    }
    return query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null;
  }, [query.data?.lastUpdated, query.dataUpdatedAt]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refresh,
    lastUpdated,
  };
}
