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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { AlertCircle, Package, DollarSign, ShoppingCart, RefreshCw, LayoutDashboard } from 'lucide-react';
import { sellerApi } from '@/domains/seller/infrastructure/api/seller-api';
import { logger } from '@/core/telemetry/logger';
import { PremiumCard, FeatureHeader } from '@/shared/ui/molecules';

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
      
      const response = await sellerApi.getMyProducts({ page: 0, size: 20 });
      const productList = response.content || [];
      
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
      
      const response = await sellerApi.getDashboardStats();
      const responseData = response?.data ?? response;
      
      // Transform backend response
      const newStats = {
        totalProducts: responseData?.shopOverview?.totalProducts ?? 0,
        lowStockProducts: responseData?.shopOverview?.outOfStockProducts ?? 0,
        totalRevenue: 0, // Backend doesn't provide this yet
        pendingOrders: responseData?.orderManagement?.newOrders ?? 0,
      };
      
      const newProducts = (responseData?.topProducts || []).map((p: any) => ({
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-10 space-y-10">
        
        <FeatureHeader
          title="Seller Console"
          subtitle={`Command center for ${session?.user?.name || 'your store'}`}
          icon={LayoutDashboard}
          actions={
            <div className="flex gap-3">
              <Button
                onClick={fetchStats}
                disabled={loading}
                variant="outline"
                className="rounded-xl border-primary/10 hover:bg-primary/5"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          }
        />

        {/* Error Alert */}
        {error && (
          <PremiumCard 
            gradientClassName="bg-destructive"
            className="border-destructive/20"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
              <div>
                <p className="font-bold text-destructive uppercase tracking-widest text-xs mb-1">System Error</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          </PremiumCard>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumCard 
            className="bg-background/40"
            contentClassName="p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Products</span>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-4xl font-black italic tracking-tighter">{stats?.totalProducts ?? '—'}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Active Inventory</p>
          </PremiumCard>

          <PremiumCard 
            className="bg-background/40"
            contentClassName="p-6"
            gradientClassName="from-orange-500 to-orange-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Critical</span>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-orange-500">
              {stats?.lowStockProducts ?? '—'}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Low Stock Alert</p>
          </PremiumCard>

          <PremiumCard 
            className="bg-background/40"
            contentClassName="p-6"
            gradientClassName="from-green-500 to-green-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Revenue</span>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-green-500">
              ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Gross Revenue</p>
          </PremiumCard>

          <PremiumCard 
            className="bg-background/40"
            contentClassName="p-6"
            gradientClassName="from-purple-500 to-purple-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Orders</span>
              <ShoppingCart className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-purple-500">
              {stats?.pendingOrders ?? '—'}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Pending Fulfillment</p>
          </PremiumCard>
        </div>

        {/* Products Section */}
        <PremiumCard
          title="Inventory Synchronization"
          description="Real-time management of your product catalog and availability"
          headerAction={
            <Button
              onClick={fetchProducts}
              disabled={loading}
              className="rounded-xl shadow-lg shadow-primary/10"
            >
              <Package className="h-4 w-4 mr-2" />
              {loading ? 'Syncing...' : 'Sync Products'}
            </Button>
          }
        >
          {products.length === 0 ? (
            <div className="text-center py-20 bg-primary/[0.02] rounded-3xl border border-dashed border-primary/10">
              <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
              <p className="text-lg font-bold text-muted-foreground">No products synchronized</p>
              <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                Connect to the backend repository to fetch your product distribution list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {products.map((product: any) => (
                <PremiumCard 
                  key={product.id} 
                  className="bg-background/60 border border-primary/5 hover:border-primary/20 transition-all group"
                  contentClassName="p-5"
                  gradientClassName="h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <h3 className="font-bold text-white mb-3 text-lg">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-green-500 font-black italic text-xl">${product.price}</span>
                    <Badge 
                      variant={product.stock > 10 ? 'default' : 'destructive'}
                      className="rounded-lg uppercase font-black tracking-tighter px-3"
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>
                </PremiumCard>
              ))}
            </div>
          )}
        </PremiumCard>
      </div>
    </div>
  );
}
