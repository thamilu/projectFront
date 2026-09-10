/**
 * Seller Dashboard - Client Component
 *
 * Deconstructed into modular, scalable enterprise widgets.
 * Handles client-side API updates, layout customization, and shortcuts overlays.
 */

'use client';

import { Session } from 'next-auth';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { sellerApi } from '@/domains/seller/infrastructure/api/seller-api';
import { logger } from '@/core/telemetry/logger';
// Direct import (not @/auth) is deliberate: this is a client component, and
// @/auth's first export line executes the real NextAuth() init server guard,
// which throws in the browser. lib/auth/types has zero next-auth/jose
// runtime dependencies, so it's safe here — see auth.ts's docblock.
import { AuthErrorCode } from '@/lib/auth/types';

// Widget imports
import { DashboardHeader } from '@/features/seller/components/dashboard/DashboardHeader';
import { MetricsOverview } from '@/features/seller/components/dashboard/MetricsOverview';
import { KpiCards } from '@/features/seller/components/dashboard/KpiCards';
import { ActionCenter } from '@/features/seller/components/dashboard/ActionCenter';
import { QuickActions } from '@/features/seller/components/dashboard/QuickActions';
import { RevenueChart, Timeframe } from '@/features/seller/components/dashboard/RevenueChart';
import { ReviewsSection, ReviewItem } from '@/features/seller/components/dashboard/ReviewsSection';
import { InventoryTable } from '@/features/seller/components/dashboard/InventoryTable';
import { ShortcutOverlay } from '@/features/seller/components/dashboard/ShortcutOverlay';
import { WidgetCustomizer, WidgetConfig } from '@/features/seller/components/dashboard/WidgetCustomizer';

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

const DEFAULT_WIDGET_CONFIG: WidgetConfig[] = [
  { id: 'metrics', name: 'Store Overview Metrics', visible: true, pinned: false, order: 1 },
  { id: 'kpi', name: 'KPI Summary Cards', visible: true, pinned: false, order: 2 },
  { id: 'chart', name: 'Revenue Trend Chart', visible: true, pinned: false, order: 3 },
  { id: 'reviews', name: 'Recent Reviews Panel', visible: true, pinned: false, order: 4 },
  { id: 'action-center', name: 'Action Center Tasks', visible: true, pinned: false, order: 5 },
  { id: 'quick-actions', name: 'Quick Action Shortcuts', visible: true, pinned: false, order: 6 },
  { id: 'inventory', name: 'Inventory Management Table', visible: true, pinned: false, order: 7 },
];

export default function SellerDashboardClient({
  session,
  initialData,
}: SellerDashboardClientProps) {
  const router = useRouter();

  // Sync data states
  const [products, setProducts] = useState(initialData?.recentProducts || []);
  // Regression: this previously defaulted to hardcoded demo numbers (180 /
  // 5 / 42580 / 18) whenever server-fetched initialData wasn't provided —
  // the exact same fabricated-fallback pattern already fixed in fetchStats()
  // below. A seller's dashboard should show 0/empty before real data
  // loads, never numbers that look like a real, populated store.
  const [stats, setStats] = useState<DashboardStats | undefined>(
    initialData?.stats || {
      totalProducts: 0,
      lowStockProducts: 0,
      totalRevenue: 0,
      pendingOrders: 0,
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialData?.error || null);

  // Active configurations
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('30D');
  const [lastRefreshedSecs, setLastRefreshedSecs] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals & overlay triggers
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Widget customizer states (Persisted to localStorage)
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGET_CONFIG;
    const saved = localStorage.getItem('seller-dashboard-widgets-custom');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_WIDGET_CONFIG;
      }
    }
    return DEFAULT_WIDGET_CONFIG;
  });

  // Review states list
  const [reviewList, setReviewList] = useState<ReviewItem[]>([
    {
      id: 1,
      rating: 5,
      comment: 'Great seller! Delivery was super fast and packaging was robust.',
      user: 'Amit K.',
      time: '1 hour ago',
      replied: false,
      replyContent: '',
      productName: 'Premium Wireless Headphones',
      sku: 'NK-1102',
      orderId: 'ORD-92837',
      verified: true
    },
    {
      id: 2,
      rating: 3,
      comment: 'Slightly late delivery on the Nike sneakers, but product quality is top notch.',
      user: 'Sneha M.',
      time: '5 hours ago',
      replied: false,
      replyContent: '',
      productName: 'Nike Air Max Sneakers',
      sku: 'NK-1103',
      orderId: 'ORD-92838',
      verified: true
    },
    {
      id: 3,
      rating: 5,
      comment: 'Excellent customer support, solved my sizing queries immediately.',
      user: 'Rahul D.',
      time: '1 day ago',
      replied: false,
      replyContent: '',
      productName: 'Ergonomic Office Chair',
      sku: 'NK-1104',
      orderId: 'ORD-92839',
      verified: false
    },
  ]);

  // Session check triggers
  useEffect(() => {
    if (session.error === AuthErrorCode.REFRESH_TOKEN_ERROR) {
      logger.warn('[Dashboard/Client] Session expired, redirecting to login');
      signOut({ callbackUrl: '/login?error=session_expired' });
    }
  }, [session.error]);

  // Sync refresh duration counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshedSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard accessibility listeners (e.g. press '?' to toggle hotkey dialogs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Retrieve metrics from api endpoints
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.debug('[Dashboard/Client] Syncing dashboard data...');
      const response = await sellerApi.getDashboardStats();
      const responseData = response?.data ?? response;

      // Regression: these previously fell back to hardcoded demo numbers
      // (180 / 5 / 42580 / 18) whenever the response shape didn't match —
      // not just for a genuinely-zero value (0 ?? 180 correctly stays 0),
      // but for any malformed/unexpected API response, silently showing a
      // fabricated "real" store size instead of an honest 0/empty state.
      const storeOverview = responseData?.storeOverview || responseData?.shopOverview || {};
      const newStats = {
        totalProducts: storeOverview.totalProducts ?? 0,
        lowStockProducts: storeOverview.outOfStockProducts ?? 0,
        totalRevenue: Number(responseData?.salesMetrics?.totalSales) || 0,
        pendingOrders: responseData?.orderManagement?.newOrders ?? 0,
      };

      const newProducts = (responseData?.topProducts || []).map((p: any) => ({
        id: p.productId,
        name: p.productName,
        price: p.currentPrice,
        stock: p.stockQuantity,
      }));

      setStats(newStats);
      setProducts(newProducts);
      setLastRefreshedSecs(0);
    } catch (err: any) {
      logger.error('[Dashboard/Client] Failed to load dashboard metrics', { error: err });
      if (err?.message?.includes('Unauthorized')) {
        setError('Session expired. Please log in again to sync catalog data.');
        return;
      }
      setError('Unable to load dashboard metrics. Reverting to cached display parameters.');
    } finally {
      setLoading(false);
    }
  };

  // Regression: this previously ran a fake setInterval progress bar (fixed
  // 25% steps every 250ms, always completing in exactly 1 second)
  // completely disconnected from any real backend operation — there is no
  // catalog-sync endpoint; the only real work here is re-fetching the
  // dashboard's own stats. The fake, precisely-timed percentage implied a
  // granular sync operation that never existed. This now just reflects
  // whether the real refresh request is actually in flight.
  const handleInventorySync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await fetchStats();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Reply submission
  const handleReplySubmit = (id: number, text: string) => {
    setReviewList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, replied: true, replyContent: text } : r))
    );
  };

  // Widget customizer methods
  const handleToggleVisibility = (id: string) => {
    const next = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    setWidgets(next);
    localStorage.setItem('seller-dashboard-widgets-custom', JSON.stringify(next));
  };

  const handleTogglePin = (id: string) => {
    const next = widgets.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w));
    setWidgets(next);
    localStorage.setItem('seller-dashboard-widgets-custom', JSON.stringify(next));
  };

  const handleMoveUp = (id: string) => {
    const index = widgets.findIndex((w) => w.id === id);
    if (index === 0) return;
    const next = [...widgets];
    const temp = next[index].order;
    next[index].order = next[index - 1].order;
    next[index - 1].order = temp;
    setWidgets(next);
    localStorage.setItem('seller-dashboard-widgets-custom', JSON.stringify(next));
  };

  const handleMoveDown = (id: string) => {
    const index = widgets.findIndex((w) => w.id === id);
    if (index === widgets.length - 1) return;
    const next = [...widgets];
    const temp = next[index].order;
    next[index].order = next[index + 1].order;
    next[index + 1].order = temp;
    setWidgets(next);
    localStorage.setItem('seller-dashboard-widgets-custom', JSON.stringify(next));
  };

  const handleResetWidgets = () => {
    setWidgets(DEFAULT_WIDGET_CONFIG);
    localStorage.setItem('seller-dashboard-widgets-custom', JSON.stringify(DEFAULT_WIDGET_CONFIG));
  };

  // Convert timer raw seconds into user-friendly textual parameters
  const lastRefreshedText = useMemo(() => {
    if (lastRefreshedSecs < 10) return 'Updated just now';
    if (lastRefreshedSecs < 60) return `Updated ${lastRefreshedSecs}s ago`;
    const mins = Math.floor(lastRefreshedSecs / 60);
    return `Updated ${mins} min ago`;
  }, [lastRefreshedSecs]);

  // Sort and filter active layout widgets
  const sortedWidgets = useMemo(() => {
    return [...widgets].sort((a, b) => a.order - b.order);
  }, [widgets]);

  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8 px-6 py-6 md:px-10">
        {/* Header Widget */}
        <DashboardHeader
          userName={session?.user?.name || 'Seller'}
          lastRefreshedText={lastRefreshedText}
          loading={loading}
          onRefresh={fetchStats}
          onCustomizeClick={() => setIsCustomizerOpen(true)}
          selectedTimeframe={activeTimeframe}
          onTimeframeChange={(tf) => setActiveTimeframe(tf as Timeframe)}
        />

        {/* Global Connection / Status Alert Overlay */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 flex items-start justify-between gap-3 text-xs" role="alert">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              onClick={fetchStats}
              className="text-[10px] uppercase tracking-widest text-destructive hover:underline font-bold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Customized Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {sortedWidgets
            .filter((w) => w.visible)
            .map((widget) => {
              switch (widget.id) {
                case 'metrics':
                  return (
                    <div key={widget.id} className="lg:col-span-3">
                      <MetricsOverview
                        catalogUsed={stats?.totalProducts || 0}
                        catalogLimit={500}
                      />
                    </div>
                  );
                case 'kpi':
                  return (
                    <div key={widget.id} className="lg:col-span-3">
                      <KpiCards
                        totalRevenue={stats?.totalRevenue || 0}
                        pendingOrders={stats?.pendingOrders ?? 0}
                        lowStockProducts={stats?.lowStockProducts ?? 0}
                        onNavigate={(href) => router.push(href)}
                      />
                    </div>
                  );
                case 'chart':
                  return (
                    <div key={widget.id} className="lg:col-span-2">
                      <RevenueChart
                        activeTimeframe={activeTimeframe}
                        onTimeframeChange={setActiveTimeframe}
                      />
                    </div>
                  );
                case 'reviews':
                  return (
                    <div key={widget.id} className="lg:col-span-1">
                      <ReviewsSection
                        reviewList={reviewList}
                        onReplySubmit={handleReplySubmit}
                      />
                    </div>
                  );
                case 'action-center':
                  return (
                    <div key={widget.id} className="lg:col-span-2">
                      <ActionCenter
                        pendingOrders={stats?.pendingOrders ?? 0}
                        lowStockProducts={stats?.lowStockProducts ?? 0}
                      />
                    </div>
                  );
                case 'quick-actions':
                  return (
                    <div key={widget.id} className="lg:col-span-1">
                      <QuickActions />
                    </div>
                  );
                case 'inventory':
                  return (
                    <div key={widget.id} className="lg:col-span-3">
                      <InventoryTable
                        products={products}
                        onSync={handleInventorySync}
                        isSyncing={isSyncing}
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}
        </div>
      </div>

      {/* Keyboard shortcut overlay Dialog */}
      <ShortcutOverlay
        isOpen={isShortcutOpen}
        onOpenChange={setIsShortcutOpen}
      />

      {/* Widget Layout Customizer Dialog */}
      <WidgetCustomizer
        isOpen={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
        widgets={widgets}
        onToggleVisibility={handleToggleVisibility}
        onTogglePin={handleTogglePin}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onReset={handleResetWidgets}
      />
    </div>
  );
}
