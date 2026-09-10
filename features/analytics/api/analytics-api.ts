import { apiClient } from '@/core/client';

export interface SellerAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  topProducts: Array<{ id: number; name: string; soldCount: number; revenue: number }>;
}

export const analyticsApi = {
  getSellerAnalytics: async (): Promise<SellerAnalyticsData> => {
    const { data } = await apiClient.get<any>('/api/v1/seller/analytics');
    return data?.data ?? data;
  },
};
