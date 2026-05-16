'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, Package, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  topProducts: Array<{ id: number; name: string; soldCount: number; revenue: number }>;
}

function StatCard({ title, value, subtitle, icon: Icon, trend }: {
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
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            trend === 'up' ? 'bg-green-100 text-green-600' : 
            trend === 'down' ? 'bg-red-100 text-red-600' : 
            'bg-blue-100 text-blue-600'}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellerAnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch('/api/v1/seller/analytics', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d?.data ?? d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          Analytics
        </h1>
        <p className="mt-1 text-muted-foreground">Track your store performance and sales trends.</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
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
      )}

      {/* Top products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Selling Products
          </CardTitle>
          <CardDescription>Your best performers by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !data?.topProducts?.length ? (
            <p className="text-center text-muted-foreground py-8">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.soldCount} units sold</p>
                  </div>
                  <Badge variant="secondary">₹{p.revenue.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Revenue trend over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data?.monthlyRevenue?.length ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm">No revenue data available yet.</p>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-end gap-2">
              {data.monthlyRevenue.map((m) => {
                const max = Math.max(...data.monthlyRevenue.map((x) => x.amount), 1);
                const height = Math.max(4, (m.amount / max) * 100);
                return (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${height}%` }}
                      title={`₹${m.amount.toLocaleString()}`}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.month.slice(0, 3)}</span>
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
