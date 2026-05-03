import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/utils/fetch-utils';
import { env } from '@/env';

export interface DashboardData {
  shopOverview: {
    shopName: string;
    shopStatus: string;
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    shopRating: number | null;
  };
  orderManagement: {
    newOrders: number;
    processingOrders: number;
    shippedOrders: number;
    completedOrders: number;
  };
  topProducts: Array<{
    productId: number;
    productName: string;
    currentPrice: number;
    category: string;
    stockQuantity: number;
  }>;
}

export function useSellerDashboard(accessToken?: string, isEnabled = true) {
  return useQuery<DashboardData, Error>({
    queryKey: ['seller-dashboard'],
    queryFn: async ({ signal }) => {
      const response = await authenticatedFetch<{ data: DashboardData } | DashboardData>(
        `${env.apiBaseUrl}/api/v1/dashboard/seller`,
        {
          accessToken,
          signal,
        }
      );
      
      // Handle both wrapped { data: ... } response or direct payload response
      return 'data' in response && response.data ? (response.data as DashboardData) : (response as DashboardData);
    },
    enabled: !!accessToken && isEnabled,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2, // Retry failed requests automatically
  });
}
