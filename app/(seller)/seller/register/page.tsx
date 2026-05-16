/**
 * Seller Onboarding Page
 *
 * Public page where customers can register to become sellers
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SellerRoleUpgradeForm } from '@/features/seller/components/SellerRoleUpgradeForm';
import { apiClient } from '@/lib/http/services';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { SellerProfile } from '@/features/seller/types';
import { AppError } from '@/lib/errors/AppError';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Become a Seller | eShop',
  description: 'Start selling your products to customers worldwide',
};

async function getInitialStatus(isAuthenticated: boolean): Promise<'IDLE' | 'PENDING' | 'SUCCESS'> {
  if (!isAuthenticated) return 'IDLE';
  
  try {
    const { data: response } = await apiClient.get<ApiResponse<SellerProfile>>(
      API_ENDPOINTS.SELLERS.PROFILE
    );

    const status = response?.data?.status ? String(response.data.status).toUpperCase() : null;
    if (status === 'ACTIVE') return 'SUCCESS';
    if (status === 'PENDING') return 'PENDING';
    return 'IDLE';
  } catch (error) {
    const err = error as AppError;
    
    // Log the error for observability but don't crash the page
    console.warn('[SellerOnboarding] Error checking initial status:', {
      status: err?.status,
      code: err?.code,
      message: err?.message
    });

    // If we get 404, check if a profile exists but is not yet approved
    if (err?.status === 404) {
      try {
        const { data: existsResponse } = await apiClient.get<ApiResponse<boolean>>(
          API_ENDPOINTS.SELLERS.PROFILE_EXISTS
        );
        if (existsResponse?.data === true) return 'PENDING';
      } catch {
        // Fallback to IDLE
      }
    }
    
    // Treat any other error (500, 403, 401, etc.) as IDLE for onboarding purposes
    // this ensures the registration form is always reachable.
    return 'IDLE';
  }
}

import { auth } from '@/auth';

export default async function SellerOnboardingPage() {
  const session = await auth();
  const isAuthenticated = !!session;
  const roles = (session as any)?.roles || [];
  const isSeller = roles.includes('SELLER');

  if (isSeller) {
    redirect(APP_ROUTES.SELLER.DASHBOARD);
  }

  const initialStatus = await getInitialStatus(isAuthenticated);

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 py-12 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Start Your Selling Journey</h1>
          <p className="text-muted-foreground mt-2 text-xl">
            Join thousands of sellers reaching millions of customers
          </p>
        </div>

        <SellerRoleUpgradeForm initialStatus={initialStatus} />

        {/* Benefits Section */}
        <div className="mx-auto mt-12 max-w-4xl">
          <h2 className="mb-6 text-center text-2xl font-semibold">Why Sell With Us?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 text-center dark:bg-gray-900">
              <div className="mb-3 text-4xl">🌍</div>
              <h3 className="mb-2 font-semibold">Global Reach</h3>
              <p className="text-muted-foreground text-sm">
                Connect with customers from around the world
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 text-center dark:bg-gray-900">
              <div className="mb-3 text-4xl">💳</div>
              <h3 className="mb-2 font-semibold">Secure Payments</h3>
              <p className="text-muted-foreground text-sm">
                Get paid on time with our secure payment system
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 text-center dark:bg-gray-900">
              <div className="mb-3 text-4xl">📊</div>
              <h3 className="mb-2 font-semibold">Analytics Dashboard</h3>
              <p className="text-muted-foreground text-sm">
                Track your sales and grow your business
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
