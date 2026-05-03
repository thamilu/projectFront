'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ClipboardList, Truck, MapPin, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AssignedDelivery {
  id: number;
  orderNumber: string;
  address: string;
  customerName: string;
  totalAmount: number;
  assignedAt: string;
}

export default function DeliveryAssignedPage() {
  const { data: session } = useSession();
  const [deliveries, setDeliveries] = useState<AssignedDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch('/api/v1/delivery/assigned', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const d = await res.json();
      setDeliveries(d?.data?.content ?? d?.content ?? d?.data ?? []);
    } catch {
      toast.error('Failed to load assigned deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [session]);

  const accept = async (id: number) => {
    try {
      await fetch(`/api/v1/delivery/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status: 'PICKED_UP' }),
      });
      toast.success('Order accepted — marked as Picked Up!');
      load();
    } catch {
      toast.error('Failed to accept order');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ClipboardList className="h-7 w-7 text-primary" />
          Assigned to Me
        </h1>
        <p className="mt-1 text-muted-foreground">Orders waiting for pickup.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No assignments</h2>
            <p className="text-sm text-muted-foreground">New orders will be assigned to you shortly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="font-semibold">Order #{d.orderNumber}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {d.address}
                  </p>
                  <p className="text-sm text-muted-foreground">Customer: {d.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-blue-100 text-blue-700">ASSIGNED</Badge>
                  <Button size="sm" onClick={() => accept(d.id)}>
                    <Truck className="mr-2 h-4 w-4" />
                    Accept & Pick Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
