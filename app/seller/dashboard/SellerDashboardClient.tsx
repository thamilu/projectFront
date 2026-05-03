/**
 * Seller Dashboard - Client Component
 * 
 * Handles client-side API calls with Bearer token authentication
 * Automatically signs out on token expiration (401) or insufficient permissions (403)
 */

'use client';

import { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, DollarSign, ShoppingCart, RefreshCw } from 'lucide-react';
import { sellerApi } from '@/lib/api/backend';
import { logger } from '@/lib/observability/logger';

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

interface SellerDashboardClientProps {
  session: Session;
  initialData: DashboardData;
}

export default function SellerDashboardClient({ 
  session, 
  initialData 
}: SellerDashboardClientProps) {
  const [products, setProducts] = useState(initialData?.recentProducts || []);
  const [stats, setStats] = useState<DashboardStats | undefined>(initialData?.stats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialData?.error || null);

  logger.debug('[Dashboard/Client] Component mounted');
  logger.debug('[Dashboard/Client] Session check', { user: session?.user?.email, roles: session?.roles });
  logger.debug('[Dashboard/Client] Initial data', { hasStats: !!stats, productsCount: products.length });

  // Check for session errors on mount and when session changes
  useEffect(() => {
    if (session.error === 'TokenExpired' || session.error === 'RefreshAccessTokenError') {
      logger.warn('[Dashboard/Client] Token expired, signing out');
      signOut({ callbackUrl: '/login?error=session_expired' });
    }
  }, [session.error]);

  // Fetch products from backend API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('[Dashboard/Client] Fetching products...');
      
      const response = await sellerApi.getProducts();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productList = (response as any).products || [];
      
      logger.info('[Dashboard/Client] Fetched products', { count: productList.length });
      setProducts(productList);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error('[Dashboard/Client] Error', { error: err });
      
      if (err?.message?.includes('Unauthorized')) {
        logger.warn('[Dashboard/Client] Token expired, signing out');
        signOut({ callbackUrl: '/login?error=unauthorized' });
        return;
      }
      
      if (err?.message?.includes('Forbidden')) {
        setError('You do not have permission to access this resource');
        return;
      }
      
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('[Dashboard/Client] Fetching dashboard stats...');
      
      const response = await sellerApi.getDashboard();
      
      // Transform backend response
      const newStats = {
        totalProducts: response.data.shopOverview.totalProducts,
        lowStockProducts: response.data.shopOverview.outOfStockProducts,
        totalRevenue: 0, // Backend doesn't provide this yet
        pendingOrders: response.data.orderManagement.newOrders,
      };
      
      const newProducts = response.data.topProducts.map(p => ({
        id: p.productId,
        name: p.productName,
        price: p.currentPrice,
        stock: p.stockQuantity,
      }));
      
      logger.info('[Dashboard/Client] Fetched stats', { stats: newStats });
      setStats(newStats);
      setProducts(newProducts);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error('[Dashboard/Client] Error', { error: err });
      
      if (err?.message?.includes('Unauthorized')) {
        logger.warn('[Dashboard/Client] Token expired, signing out');
        signOut({ callbackUrl: '/login?error=unauthorized' });
        return;
      }
      
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Welcome Card */}
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Seller Dashboard</CardTitle>
                <CardDescription className="text-base">
                  Welcome back, {session?.user?.name || session?.user?.email || 'Seller'}!
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>



        {/* Error Alert */}
        {error && (
          <Card className="border-red-500 border-2 bg-red-50 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Products</span>
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold">{stats?.totalProducts ?? '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">Total products</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Low Stock</span>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.lowStockProducts ?? '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Revenue</span>
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">
                ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total revenue</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Orders</span>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.pendingOrders ?? '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Manage your product inventory</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchStats}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Stats
                </Button>
                <Button
                  onClick={fetchProducts}
                  disabled={loading}
                  size="sm"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {loading ? 'Loading...' : 'Load Products'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No products found.</p>
                <p className="text-sm text-gray-400">Click "Load Products" to fetch from backend.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {products.map((product: any) => (
                  <Card key={product.id} className="border hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-green-600 font-bold">${product.price}</span>
                        <Badge variant={product.stock > 10 ? 'default' : 'destructive'}>
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
