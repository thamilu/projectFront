'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeliveryOrder {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string;
  address: string;
  totalAmount: number;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function DeliveryOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch('/api/v1/delivery/orders', {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const d = await res.json();
      setOrders(d?.data?.content ?? d?.content ?? d?.data ?? []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [session]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`/api/v1/delivery/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status }),
      });
      toast.success('Status updated!');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="h-7 w-7 text-primary" />
          Delivery Orders
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your assigned and active delivery orders.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No active orders</h2>
            <p className="mt-1 text-muted-foreground">New delivery assignments will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Order #{order.orderNumber}</span>
                      <Badge className={STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-700'}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {order.address}
                    </p>
                    <p className="text-sm text-muted-foreground">Customer: {order.customerName}</p>
                    <p className="text-sm font-medium">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'ASSIGNED' && (
                      <Button size="sm" onClick={() => updateStatus(order.id, 'PICKED_UP')}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Picked Up
                      </Button>
                    )}
                    {order.status === 'PICKED_UP' && (
                      <Button size="sm" onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}>
                        <Truck className="mr-2 h-4 w-4" /> Out for Delivery
                      </Button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'DELIVERED')}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
