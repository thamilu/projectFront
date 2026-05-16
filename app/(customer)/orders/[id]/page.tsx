'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Package, Truck, CheckCircle2, Clock, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/constants/routes/app-routes';

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  items: Array<{
    id: number;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_COLOR: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-yellow-100 text-yellow-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: session } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !id) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/orders/${id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.data ?? data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
        <Package className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        <h1 className="mb-2 text-2xl font-bold">Order not found</h1>
        <p className="text-muted-foreground mb-6">{error || 'We could not find this order.'}</p>
        <Button asChild>
          <Link href={APP_ROUTES.ORDERS}>Back to orders</Link>
        </Button>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={APP_ROUTES.ORDERS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Orders
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
        <Badge className={STATUS_COLOR[order.status] || ''}>{order.status}</Badge>
      </div>

      {/* Progress tracker */}
      {order.status !== 'CANCELLED' && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative flex items-center justify-between">
              <div className="bg-muted absolute top-4 right-0 left-0 h-1">
                <div
                  className="h-1 bg-green-500 transition-all"
                  style={{
                    width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%`,
                  }}
                />
              </div>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const Icon =
                  i === STATUS_STEPS.length - 1
                    ? CheckCircle2
                    : i === 2
                      ? Truck
                      : i === 0
                        ? Clock
                        : Package;
                return (
                  <div key={step} className="relative flex flex-col items-center gap-1 text-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        done
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-muted bg-background text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="hidden text-xs sm:block">{step.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              <div className="bg-muted h-16 w-16 flex-shrink-0 rounded-lg" />
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
          <div className="flex justify-between pt-4 font-bold">
            <span>Total</span>
            <span>₹{order.totalAmount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} –{' '}
              {order.shippingAddress.pincode}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
