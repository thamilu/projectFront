'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Package,
  DollarSign,
  PlusCircle,
  Archive,
  BarChart2,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@/lib/observability/logger';
import { AppSession, getNormalizedRoles } from '@/features/seller/utils/auth';
import { useSellerDashboard } from '@/features/seller/hooks/useSellerDashboard';
import { StatCard } from '@/features/seller/components/StatCard';
import { DashboardSkeleton } from '@/features/seller/components/DashboardSkeleton';

const QUICK_ACTIONS = [
  { label: 'Add Product', icon: PlusCircle, path: '/seller/products/create' },
  { label: 'View Orders', icon: Archive, path: '/seller/orders' },
  { label: 'View Dashboard', icon: BarChart2, path: '/seller' },
  { label: 'Shop Settings', icon: Settings, path: '/seller/settings' },
];

const SYSTEM_ROLES = new Set(['OFFLINE_ACCESS', 'UMA_AUTHORIZATION', 'DEFAULT-ROLES-ESHOP']);

export default function SellerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  logger.debug('[Seller/Page] Component rendering', {
    status,
    user: session?.user?.email,
    roles: session?.user?.roles,
  });

  const accessToken = (session as any)?.accessToken as string | undefined;

  const { data: dashboard, isLoading, error, refetch } = useSellerDashboard(
    accessToken,
    status === 'authenticated'
  );

  // Loading state with Skeleton UI
  if (status === 'loading' || isLoading) {
    return <DashboardSkeleton />;
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="rounded border border-yellow-400 bg-yellow-50 px-4 py-3 text-yellow-700">
              Please log in to access the seller dashboard.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 py-6 md:px-6">
          <Card className="border-2 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded bg-red-50 px-4 py-3 text-red-700"
                aria-live="assertive"
                role="alert"
              >
                <strong>Error:</strong> {error.message || 'Failed to fetch dashboard data'}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => refetch()}
                  className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 transition"
                  aria-label="Retry loading dashboard"
                >
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const shop = dashboard?.shopOverview;

  // Format currency safely
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const activeRoles = getNormalizedRoles(session as AppSession | null).filter(
    (role) => !SYSTEM_ROLES.has(role)
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="border-2 bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-purple-600">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {shop?.shopName && shop?.shopName !== 'N/A'
                        ? shop.shopName
                        : session?.user?.name || 'Your Shop'}
                    </CardTitle>
                    <CardDescription className="text-base">
                      Welcome back, {session?.user?.name || session?.user?.email || 'Seller'}!
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeRoles.map((role) => (
                    <Badge
                      key={role}
                      className="bg-linear-to-r from-blue-600 to-purple-600 px-3 py-1 text-sm text-white"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Products"
              value={shop?.totalProducts || 0}
              subtitle="All products"
              icon={Package}
              iconColorClass="text-blue-600"
            />
            <StatCard
              title="Active Products"
              value={shop?.activeProducts || 0}
              subtitle="Available for sale"
              icon={Package}
              iconColorClass="text-green-600"
              valueColorClass="text-green-600"
            />
            <StatCard
              title="Out of Stock"
              value={shop?.outOfStockProducts || 0}
              subtitle="Needs restocking"
              icon={AlertCircle}
              iconColorClass="text-orange-600"
              valueColorClass="text-orange-600"
            />
            <StatCard
              title="Shop Rating"
              value={shop?.shopRating ? shop.shopRating.toFixed(1) : 'N/A'}
              subtitle="Customer rating"
              icon={DollarSign}
              iconColorClass="text-yellow-600"
              valueColorClass="text-yellow-600"
            />
          </div>

          {/* Order Management */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Track your order status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded bg-blue-50 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboard?.orderManagement?.newOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">New Orders</p>
                </div>
                <div className="rounded bg-yellow-50 p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboard?.orderManagement?.processingOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Processing</p>
                </div>
                <div className="rounded bg-purple-50 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboard?.orderManagement?.shippedOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Shipped</p>
                </div>
                <div className="rounded bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {dashboard?.orderManagement?.completedOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Products */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Your best performing items</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.topProducts && dashboard.topProducts.length > 0 ? (
                  <div className="space-y-2">
                    {dashboard.topProducts.map((product) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between rounded bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{product.productName}</span>
                          <span className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                            {product.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            Stock: {product.stockQuantity}
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(product.currentPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <p className="text-gray-500 font-medium">You haven&apos;t added any products yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Add your first product to start selling.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 h-fit">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your shop and inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        aria-label={action.label}
                        onClick={() => router.push(action.path)}
                        className="hover:border-primary hover:bg-accent flex flex-col items-center justify-center rounded-lg border-2 p-4 text-center transition-all"
                      >
                        <Icon className="mb-2 h-8 w-8 text-purple-600" />
                        <div className="text-sm font-medium">{action.label}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
