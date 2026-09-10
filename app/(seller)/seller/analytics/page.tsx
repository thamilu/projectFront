'use client';

import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Star,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { useSellerAnalytics } from '@/features/analytics';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              trend === 'up'
                ? 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                : trend === 'down'
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
            }`}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellerAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useSellerAnalytics();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8" data-testid="analytics-loading">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-md py-20 text-center" data-testid="analytics-error">
        <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-foreground text-lg font-semibold">Failed to load analytics</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                We couldn't retrieve store stats. Make sure you are logged in as a seller and try
                again.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex min-h-[44px] items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="analytics-success">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BarChart3 className="text-primary h-7 w-7" aria-hidden="true" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track your store performance and sales trends.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(data?.totalRevenue ?? 0).toLocaleString()}`}
          subtitle="All time"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Total Orders"
          value={(data?.totalOrders ?? 0).toString()}
          subtitle="All time"
          icon={ShoppingBag}
          trend="up"
        />
        <StatCard
          title="Products Listed"
          value={(data?.totalProducts ?? 0).toString()}
          icon={Package}
          trend="neutral"
        />
        <StatCard
          title="Average Rating"
          value={`${(data?.averageRating ?? 0).toFixed(1)} ★`}
          subtitle="Customer reviews"
          icon={Star}
          trend="up"
        />
      </div>

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="text-primary h-5 w-5" aria-hidden="true" />
            Top Selling Products
          </CardTitle>
          <CardDescription>Your best performers by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.topProducts?.length ? (
            <p className="text-muted-foreground py-8 text-center">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="border-muted hover:bg-muted/10 flex items-center gap-4 rounded-lg border p-3 transition-colors"
                >
                  <span className="bg-muted text-muted-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-medium">{p.name}</p>
                    <p className="text-muted-foreground text-xs">{p.soldCount} units sold</p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    ₹{p.revenue.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Revenue</CardTitle>
          <CardDescription>Revenue trend over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.monthlyRevenue?.length ? (
            <div className="text-muted-foreground flex h-48 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 h-10 w-10 opacity-30" aria-hidden="true" />
                <p className="text-sm">No revenue data available yet.</p>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-end gap-2 pt-6">
              {data.monthlyRevenue.map((m) => {
                const max = Math.max(...data.monthlyRevenue.map((x) => x.amount), 1);
                const height = Math.max(4, (m.amount / max) * 100);
                return (
                  <div key={m.month} className="group flex flex-1 flex-col items-center gap-1">
                    <div
                      className="bg-primary/80 hover:bg-primary w-full cursor-pointer rounded-t transition-all duration-250"
                      style={{ height: `${height}%` }}
                      title={`₹${m.amount.toLocaleString()}`}
                      aria-label={`${m.month}: ₹${m.amount.toLocaleString()}`}
                      role="img"
                    />
                    <span className="text-muted-foreground text-[10px] font-medium">
                      {m.month.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
