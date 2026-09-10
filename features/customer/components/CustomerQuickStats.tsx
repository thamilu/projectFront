'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowRight, Truck } from 'lucide-react';
import { apiClient } from '@/core/client';
import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';
import { APP_ROUTES } from '@/shared/routes';
import { Button } from '@/shared/ui/atoms/button';
import { useRouter } from 'next/navigation';
import { CategoryIcon } from '@/shared/ui/common/CategoryIcon';
import { logger } from '@/core/telemetry/logger';

interface ActiveOrderItem {
  productName: string;
}

interface ActiveOrder {
  id: number;
  orderNumber: string;
  status: string;
  estimatedDelivery?: string;
  totalAmount: number;
  items: ActiveOrderItem[];
}

interface CustomerDashboardResponse {
  activeOrder?: ActiveOrder | null;
  data?: CustomerDashboardResponse;
}

interface CustomerQuickStatsProps {
  userId: string;
  userName: string;
}

const ORDER_STATUS_STEPS: Record<string, number> = {
  CONFIRMED: 0,
  PACKED: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
};

const ORDER_STEP_LABELS = ['Confirmed', 'Packed', 'Shipped', 'Out', 'Delivered'];

const FEATURED_CATEGORIES = [
  { name: 'Electronics', iconName: 'Laptop', color: '#3b82f6' },
  { name: 'Fashion', iconName: 'Shirt', color: '#ec4899' },
  { name: 'Home', iconName: 'Home', color: '#f59e0b' },
  { name: 'Beauty', iconName: 'Sparkles', color: '#a855f7' },
  { name: 'Sports', iconName: 'Dumbbell', color: '#10b981' },
  { name: 'Books', iconName: 'BookOpen', color: '#6366f1' },
];

export function CustomerQuickStats({ userId: _userId, userName: _userName }: CustomerQuickStatsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerDashboardResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<CustomerDashboardResponse>(
          API_ENDPOINTS.DASHBOARD.CUSTOMER,
          { headers: { 'X-Bypass-Toast': 'true' } }
        );
        setData(response.data?.data ?? response.data);
      } catch (error) {
        // Ambient background read for an optional "active order" banner —
        // the component already degrades gracefully (banner just doesn't
        // render) with no user-facing error needed. logger.error (not raw
        // console.error) is used deliberately: console.error with a real
        // Error instance is what triggers Next.js's dev-mode error overlay,
        // making an already-handled, non-fatal fetch failure look like an
        // unhandled crash.
        logger.error('Failed to fetch customer quick stats', { error });
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    } else if (session === null) {
      setLoading(false);
    }
  }, [session]);

  const currentOrder = data?.activeOrder;
  const currentStep = currentOrder
    ? (ORDER_STATUS_STEPS[currentOrder.status?.toUpperCase()] ?? 0)
    : 0;

  return (
    <div className="w-full overflow-x-hidden bg-slate-50/50 py-6 dark:bg-transparent">
      <div className="container mx-auto space-y-6">
        {/* Active Order Banner (Hardened) */}
        {!loading && currentOrder && (
          <div className="group flex flex-col justify-between rounded-3xl border border-emerald-100 bg-emerald-50 p-8 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500 p-2.5 text-white">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                      Tracking Order
                    </p>
                    <h3 className="font-bold text-slate-900 dark:text-emerald-100">
                      #{currentOrder.orderNumber}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  onClick={() => router.push(`/orders/${currentOrder.id}`)}
                  aria-label="Track your order"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Est. delivery:{' '}
                  <span className="font-bold text-slate-900 dark:text-emerald-50">
                    {currentOrder.estimatedDelivery || 'Pending'}
                  </span>
                </p>
                <p className="text-muted-foreground line-clamp-1 text-xs italic">
                  {currentOrder.items?.[0]?.productName || 'Order Items'}
                </p>
              </div>
            </div>

            <div className="relative mt-6 px-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-900/50">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${(currentStep / (ORDER_STEP_LABELS.length - 1)) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-[9px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                  {ORDER_STEP_LABELS[currentStep]}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Arriving</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Chips - Hardened Navigation */}
        <div className="pt-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 rounded-full bg-blue-500" />
              <h2 className="text-lg font-bold tracking-tight">Quick Categories</h2>
            </div>
          </div>
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-4">
            {FEATURED_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() =>
                  router.push(`${APP_ROUTES.PRODUCTS}?category=${cat.name.toLowerCase()}`)
                }
                className="group flex flex-none items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 transition-all hover:border-blue-500/50 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-900/10"
              >
                <CategoryIcon
                  name={cat.iconName}
                  className="h-5 w-5 text-slate-500 transition-colors group-hover:text-blue-500 dark:text-slate-400 dark:group-hover:text-blue-400"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
