/**
 * Dashboard API Service
 */

import { apiClient } from '../axios';
import type { ApiResponse } from '@/types';

const DASHBOARD_BASE = '/api/home';

export interface DashboardData {
  role: string;
  summary: unknown;
  recentActivity: unknown[];
  statistics: unknown;
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get<ApiResponse<DashboardData>>(DASHBOARD_BASE);
    return response.data.data!;
  },
};
