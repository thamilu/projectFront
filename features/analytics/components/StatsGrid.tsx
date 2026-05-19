'use client';

import { useAnalyticsStats } from '../hooks/use-analytics';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/shared/utils';

export function StatsGrid() {
  const { data: stats, isLoading, error } = useAnalyticsStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 w-full animate-pulse rounded-2xl border bg-card/50 p-6"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-dashed border-destructive/20 bg-destructive/5 text-sm text-destructive">
        Failed to load dashboard metrics.
      </div>
    );
  }

  const items = [
    {
      title: 'Total Revenue',
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      change: stats.ordersChange,
      icon: ShoppingBag,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toLocaleString(),
      change: stats.customersChange,
      icon: Users,
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      change: stats.conversionChange,
      icon: BarChart3,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isPositive = item.change >= 0;

        return (
          <div
            key={idx}
            className={cn(
              "group relative flex flex-col p-6 rounded-2xl border bg-card text-card-foreground shadow-sm",
              "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-default",
              "overflow-hidden"
            )}
          >
            {/* Ambient background hover gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10",
              item.color
            )} />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{item.title}</span>
              <div className={cn("p-2 rounded-xl border bg-background", item.color)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-foreground">{item.value}</span>
              
              <div className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                isPositive 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {item.change}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
