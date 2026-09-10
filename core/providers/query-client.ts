import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export const QUERY_CLIENT_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      structuralSharing: true,
    },
  },
};

/**
 * Creates a new QueryClient instance.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient(QUERY_CLIENT_CONFIG);
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * getQueryClient
 * Resolves a singleton QueryClient in the browser, but isolates requests on the server-side.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

/**
 * resetQueryClient
 * Clears and resets the browser query client.
 */
export function resetQueryClient(): void {
  if (browserQueryClient) {
    browserQueryClient.clear();
    browserQueryClient = undefined;
  }
}
