'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Sparkles, 
  Package, 
  ShoppingCart, 
  Heart, 
  Award, 
  ArrowRight,
  MapPin,
  Shield,
  Truck,
  ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/http/services';
import { API_ENDPOINTS } from '@/constants/api/endpoints';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CustomerQuickStatsProps {
  session: any;
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
  { name: 'Electronics', icon: '💻', color: '#3b82f6' },
  { name: 'Fashion',     icon: '👗', color: '#ec4899' },
  { name: 'Home',        icon: '🏠', color: '#f59e0b' },
  { name: 'Beauty',      icon: '💄', color: '#a855f7' },
  { name: 'Sports',      icon: '⚽', color: '#10b981' },
  { name: 'Toys',        icon: '🧸', color: '#f97316' },
  { name: 'Books',       icon: '📚', color: '#6366f1' },
  { name: 'Garden',      icon: '🌿', color: '#22c55e' },
];

export function CustomerQuickStats({ session: initialSession }: CustomerQuickStatsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const userSession = session || initialSession;
  const firstName = userSession?.user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = userSession?.accessToken;
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiClient.get<any>(API_ENDPOINTS.DASHBOARD.CUSTOMER);
        setData(response.data?.data ?? response.data);
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userSession]);

  const stats = [
    {
      label: 'Orders',
      value: data?.accountInfo?.totalOrders ?? 0,
      icon: Package,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      sub: 'Lifetime',
      href: '/orders',
    },
    {
      label: 'Cart',
      value: data?.cartInfo?.itemCount ?? 0,
      icon: ShoppingCart,
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      sub: formatCurrency(data?.cartInfo?.totalValue ?? 0),
      href: APP_ROUTES.CART,
    },
    {
      label: 'Wishlist',
      value: data?.wishlistInfo?.itemCount ?? 0,
      icon: Heart,
      color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      sub: 'Saved',
      href: '/wishlist',
    },
    {
      label: 'Points',
      value: data?.rewardPoints ?? 0,
      icon: Award,
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      sub: 'Redeemable',
      href: '/account/points',
    },
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentOrder = data?.activeOrder;
  const currentStep = currentOrder ? (ORDER_STATUS_STEPS[currentOrder.status?.toUpperCase()] ?? 0) : 0;

  return (
    <div className="w-full overflow-x-hidden py-6 bg-slate-50/50 dark:bg-transparent">
      <div className="container mx-auto space-y-6">
        
        {/* Banner Grid (Greeting + Active Order) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Premium Greeting Banner */}
          <div className={cn(
            "relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-8 text-white shadow-xl transition-all duration-500",
            currentOrder ? "lg:col-span-8" : "lg:col-span-12"
          )}>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md border border-white/10">
                  <Sparkles className="h-3 w-3" />
                  Personalized for you
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {getTimeGreeting()}, {firstName}! 👋
                </h1>
                <p className="text-blue-100 max-w-md">
                  Welcome back! Discover deals crafted just for you today.
                </p>
                <div className="pt-4 flex items-center gap-4">
                  <Button 
                    size="sm" 
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-full px-6"
                    onClick={() => router.push(APP_ROUTES.PRODUCTS)}
                  >
                    Shop Now
                  </Button>
                </div>
              </div>
              
              <div className="hidden sm:flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                  <div className="rounded-lg bg-blue-400/20 p-2">
                    <MapPin className="h-5 w-5 text-blue-300" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Deliver to</span>
                    <span className="font-semibold text-white">San Francisco, CA</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                  <div className="rounded-lg bg-blue-400/20 p-2">
                    <Shield className="h-5 w-5 text-blue-300" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Secure Payment</span>
                    <span className="font-semibold text-white">100% Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Order Banner (Hardened) */}
          {currentOrder && (
            <div className="lg:col-span-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-8 shadow-sm flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500 text-white p-2.5">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
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
                    Est. delivery: <span className="text-slate-900 dark:text-emerald-50 font-bold">{currentOrder.estimatedDelivery || 'Pending'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    {currentOrder.items?.[0]?.productName || 'Order Items'}
                  </p>
                </div>
              </div>

              <div className="mt-6 relative px-1">
                <div className="h-1.5 w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(currentStep / (ORDER_STEP_LABELS.length - 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">{ORDER_STEP_LABELS[currentStep]}</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Arriving</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <button 
              key={stat.label} 
              onClick={() => router.push(stat.href)}
              className="group relative text-left overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className={`inline-flex rounded-xl p-2.5 border ${stat.color} transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              
              <div className="mt-4 space-y-1">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{stat.sub}</p>
                  </>
                )}
              </div>
              
              <div className="absolute bottom-4 right-4 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </button>
          ))}
        </div>

        {/* Category Chips - Hardened Navigation */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-blue-500 rounded-full" />
              <h2 className="text-lg font-bold tracking-tight">Quick Categories</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
            {FEATURED_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => router.push(`${APP_ROUTES.PRODUCTS}?category=${cat.name.toLowerCase()}`)}
                className="flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">{cat.icon}</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
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
