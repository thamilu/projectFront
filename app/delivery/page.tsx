'use client';

import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { APP_ROUTES } from '@/constants/routes/app-routes';
import { StatsCard } from '@/components/ui/stats-card';

export default function DeliveryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(APP_ROUTES.AUTH_LOGIN);
      return;
    }
    if (!user?.roles?.includes(UserRole.DELIVERY_AGENT)) {
      router.push(APP_ROUTES.HOME);
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 px-4 md:px-6 py-6">
        <Sidebar />
        <main className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Assigned" value={12} />
            <StatsCard title="In Transit" value={5} />
            <StatsCard title="Delivered" value={21} />
            <StatsCard title="Issues" value={1} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Delivery Agent Dashboard</CardTitle>
              <CardDescription>Welcome{user ? `, ${user.given_name || user.name || user.preferred_username || user.sub}` : ''}. View and update assigned deliveries.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quick links: Assigned Deliveries, Status Updates, Route Planner.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
