/**
 * Seller Dashboard - Server Component
 * 
 * Implements two-layer authentication:
 * 1. Middleware checks authentication and SELLER role
 * 2. This page validates session and fetches initial data from backend API
 * 3. Client component makes subsequent API calls with Bearer token
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SellerDashboardClient from './SellerDashboardClient';
import { serverBackendFetch } from '@/core/client/server-fetch';
import { type SellerDashboardResponse } from '@/domains/seller/contracts/seller-dashboard.types';
import { logger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface DashboardData {
  stats?: DashboardStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentProducts?: any[];
  error?: string;
}

export default async function SellerDashboardPage() {
  logger.debug('[SellerDashboard/Page] Rendering server component');

  const session = await auth();

  logger.debug('[SellerDashboard/Page] Session check', { user: session?.user?.email, roles: session?.roles });

  // Double-check authentication (middleware should have caught this)
  if (!session) {
    logger.warn('[SellerDashboard/Page] No session, redirecting to login');
    redirect('/login?callbackUrl=/seller/dashboard');
  }

  // Double-check role (middleware should have caught this)
  if (!session.roles?.includes('SELLER')) {
    logger.warn('[SellerDashboard/Page] Not a seller in session, redirecting to onboarding to verify status');
    redirect(APP_ROUTES.SELLER.REGISTER);
  }

  // Check for session errors
  if (session.error) {
    logger.warn('[SellerDashboard/Page] Session has error', { error: session.error });
    redirect('/login?error=session_expired');
  }

  let initialData: DashboardData = {};

  try {
    const token = (session as any).accessToken;
    logger.debug('[SellerDashboard/Page] Fetching data with token');

    const data = await serverBackendFetch<SellerDashboardResponse>(
      '/api/v1/dashboard/seller',
      token
    );

    const dashboardData = data?.data;

    initialData = {
      stats: {
        totalProducts: dashboardData?.shopOverview?.totalProducts || 0,
        lowStockProducts: dashboardData?.shopOverview?.outOfStockProducts || 0,
        totalRevenue: 0,
        pendingOrders: dashboardData?.orderManagement?.newOrders || 0,
      },
      recentProducts: dashboardData?.topProducts?.map((p: any) => ({
        id: p.productId,
        name: p.productName,
        price: p.currentPrice,
        stock: p.stockQuantity,
      })) || [],
    };

    logger.info('[SellerDashboard/Page] Backend data fetched successfully');
  } catch (error: any) {
    const internalUrl = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8082';
    let errorMessage = error?.message;

    // Harden: Detect and report connection issues clearly
    if (error?.status === 0 || errorMessage === 'fetch failed') {
      logger.error(`[SellerDashboard] Backend service unreachable at ${internalUrl}`);
      errorMessage = 'The backend service is currently unreachable. Please check if the server is running.';
    }

    // Try to parse JSON errors
    try {
      if (errorMessage && (errorMessage.startsWith('{') || errorMessage.startsWith('['))) {
        const parsed = JSON.parse(errorMessage);
        errorMessage = parsed.error || parsed.message || errorMessage;
      }
    } catch (e) {
      // ignore parse error
    }

    const isIncompleteProfile =
      error?.status === 428 ||
      errorMessage?.includes('428') ||
      /complete.*seller profile/i.test(errorMessage || '') ||
      errorMessage?.includes('User not found');

    if (isIncompleteProfile) {
      logger.warn('[SellerDashboard/Page] Incomplete seller profile');
    }

    logger.error('[SellerDashboard/Page] Error fetching dashboard data', { error: errorMessage });
    initialData.error = errorMessage || 'Failed to connect to backend';
  }

  return (
    <SellerDashboardClient
      session={session}
      initialData={initialData}
    />
  );
}
