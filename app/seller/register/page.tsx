/**
 * Seller Onboarding Page
 *
 * Public page where customers can register to become sellers
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SellerRoleUpgradeForm } from '@/features/seller/components/SellerRoleUpgradeForm';
import { serverFetch } from '@/lib/server-api-client';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { SellerProfile } from '@/features/seller/types';
import { FetchError } from '@/lib/utils/fetch-utils';
import { APP_ROUTES } from '@/constants/routes/app-routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Become a Seller | eShop',
  description: 'Start selling your products to customers worldwide',
};

async function getInitialStatus(): Promise<'IDLE' | 'PENDING' | 'SUCCESS'> {
  try {
    const response = await serverFetch<ApiResponse<SellerProfile>>(API_ENDPOINTS.SELLERS.PROFILE, {
      cache: 'no-store',
    });

    const status = response?.data?.status ? String(response.data.status).toUpperCase() : null;
    if (status === 'ACTIVE') return 'SUCCESS';
    if (status === 'PENDING') return 'PENDING';
    return 'IDLE';
  } catch (error) {
    const err = error as FetchError;
    // If we get 401, 403, or 404, we don't have a visible profile with the current token
    if (err?.status && [401, 403, 404].includes(err.status)) {
      try {
        const existsResponse = await serverFetch<ApiResponse<boolean>>(
          API_ENDPOINTS.SELLERS.PROFILE_EXISTS,
          { cache: 'no-store' }
        );
        if (existsResponse?.data === true) return 'PENDING';
      } catch {
        // Any error in fallback means we treat it as IDLE for now
      }
      return 'IDLE';
    }
    // Re-throw other errors
    throw error;
  }
}

export default async function SellerOnboardingPage() {
  const initialStatus = await getInitialStatus();

// We must not redirect here if the role in the session isn't synced yet.
// The SellerRoleUpgradeForm client component handles checking the profile
// and triggering signIn('keycloak') to sync the SELLER role before routing to dashboard.

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
