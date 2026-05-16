import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { ApiError } from '@/types/api';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: (query) => {
      return !query.queryKey.includes('static');
    },
    retry: (failureCount, error) => {
      const apiError = error as ApiError;
      if (apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'online',
  },
  mutations: {
    retry: false,
    networkMode: 'online',
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
