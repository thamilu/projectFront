/**
 * Seller Dashboard - Server Component
 * 
 * Implements two-layer authentication:
 * 1. Middleware checks authentication and SELLER role
 * 2. This page validates session and fetches initial data from backend API
 * 3. Client component makes subsequent API calls with Bearer token
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import SellerDashboardClient from './SellerDashboardClient';
import { serverBackendFetch, SellerDashboardResponse } from '@/lib/api/backend';
import { logger } from '@/lib/observability/logger';
import { APP_ROUTES } from '@/constants/routes/app-routes';

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
  
  const session = await getServerSession(authOptions);

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

  // Fetch initial data from backend API (SERVER-SIDE)
  let initialData: DashboardData = {};
  
  try {
    console.log('[SellerDashboard] Starting server fetch...');
    logger.debug('[SellerDashboard/Page] Fetching seller dashboard data from backend...');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (session as any).accessToken;
    console.log('[SellerDashboard] Token length:', token ? token.length : 0);

    const data = await serverBackendFetch<SellerDashboardResponse>(
      '/api/v1/dashboard/seller',
      token
    );

    console.log('[SellerDashboard] Fetch success. Data keys:', Object.keys(data || {}));

    // Transform backend response to match our component interface
    const dashboardData = data?.data;
    
    initialData = {
      stats: {
        totalProducts: dashboardData?.shopOverview?.totalProducts || 0,
        lowStockProducts: dashboardData?.shopOverview?.outOfStockProducts || 0,
        totalRevenue: 0, // Backend doesn't provide this yet
        pendingOrders: dashboardData?.orderManagement?.newOrders || 0,
      },
      recentProducts: dashboardData?.topProducts?.map(p => ({
        id: p.productId,
        name: p.productName,
        price: p.currentPrice,
        stock: p.stockQuantity,
      })) || [],
    };
    
    logger.info('[SellerDashboard/Page] Backend data fetched successfully');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[SellerDashboard] CAUGHT ERROR:', error);
    console.error('[SellerDashboard] Error message:', error?.message);
    console.error('[SellerDashboard] Error status:', error?.status);

    let errorMessage = error?.message;
    let isProfileIncomplete = false;

    // Try to parse JSON error message
    try {
      if (errorMessage && (errorMessage.startsWith('{') || errorMessage.startsWith('['))) {
        const parsed = JSON.parse(errorMessage);
        errorMessage = parsed.error || parsed.message || errorMessage;
        console.log('[SellerDashboard] Parsed error message:', errorMessage);
      }
    } catch (e) {
      // ignore parse error
    }

    // Check for 428 status OR specific text indicating incomplete profile
    const isIncompleteProfile = 
      error?.status === 428 || 
      errorMessage?.includes('428') || 
      /complete.*seller profile/i.test(errorMessage || '') ||
      errorMessage?.includes('User not found');
    
    if (isIncompleteProfile) {
      logger.warn('[SellerDashboard/Page] Incomplete seller profile detected (ignoring redirect for now)');
      console.log('[SellerDashboard] Skipping redirect to onboarding...');
      // redirect(APP_ROUTES.SELLER.REGISTER);
    }

    logger.error('[SellerDashboard/Page] Failed to fetch from backend', {
      message: errorMessage,
      name: error?.name,
    });
    initialData.error = errorMessage || 'Failed to connect to backend';
  }

  logger.debug('[SellerDashboard/Page] Rendering client component with initial data');

  return (
    <SellerDashboardClient 
      session={session} 
      initialData={initialData} 
    />
  );
}
