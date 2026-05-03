import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

interface AdminDashboardData {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalShops: number;
    totalOrders: number;
    pendingOrders: number;
    todayOrders: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  userStats: {
    customers: number;
    sellers: number;
    deliveryAgents: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  recentActivities: Array<{
    action: string;
    time: string;
    type: string;
  }>;
  systemHealth: {
    status: string;
    uptime: string;
    serverLoad: string;
    databaseStatus: string;
  };
  role: string;
  timestamp: string;
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/dashboard/admin');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry - backend error needs to be fixed first
  });
}
