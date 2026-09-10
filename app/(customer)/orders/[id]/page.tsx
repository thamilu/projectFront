'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { APP_ROUTES } from '@/shared/routes';
import { useOrder } from '@/features/orders/hooks/use-orders';
import { useOrderUpdates } from '@/features/orders/hooks/use-order-updates';
import { OrderStatus } from '@/domains/order/contracts/order.types';

const STATUS_STEPS = [
  OrderStatus.PLACED,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const STATUS_COLOR: Record<OrderStatus | 'CANCELLED', string> = {
  [OrderStatus.PLACED]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [OrderStatus.CONFIRMED]:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  [OrderStatus.PACKED]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  [OrderStatus.RETURNED]: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const idStr = params?.id;
  const idNum = idStr ? parseInt(idStr, 10) : 0;

  const { data: order, isLoading, isError, refetch } = useOrder(idNum);
  // Hooks must run unconditionally before the early returns below.
  const { status: liveStatusRaw, isConnected } = useOrderUpdates(idStr ?? '');

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10" data-testid="order-loading">
        <div className="flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center" data-testid="order-error">
        <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10 mx-auto max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-full">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-foreground text-xl font-bold">Order details not found</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                We could not retrieve order details from the server. Please verify your connection.
              </p>
            </div>
            <div className="flex w-full justify-center gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex min-h-[44px] items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
              <Button asChild className="min-h-[44px]" variant="secondary">
                <Link href={APP_ROUTES.ORDERS}>Back to orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prefer the live WebSocket status over the initially-fetched one, but
  // only if it's a value the enum actually recognizes — the push payload's
  // `status` field is a plain string from the wire, not type-checked against
  // OrderStatus, so an unrecognized value falls back to the known-good
  // fetched status rather than silently breaking the color/step lookups below.
  const liveStatus =
    liveStatusRaw && (Object.values(OrderStatus) as string[]).includes(liveStatusRaw)
      ? (liveStatusRaw as OrderStatus)
      : null;
  const effectiveStatus = liveStatus ?? order.orderStatus;

  const statusKey = (
    effectiveStatus === OrderStatus.CANCELLED ? 'CANCELLED' : effectiveStatus
  ) as OrderStatus | 'CANCELLED';
  const currentStep = STATUS_STEPS.indexOf(effectiveStatus);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10" data-testid="order-success">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="min-h-[40px] px-3">
          <Link href={APP_ROUTES.ORDERS} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Orders
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
        <Badge
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[statusKey] || ''}`}
        >
          {effectiveStatus}
        </Badge>
        {isConnected && (
          <Badge variant="secondary" className="gap-1 text-xs" aria-label="Live updates active">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Live
          </Badge>
        )}
      </div>

      {/* Progress tracker */}
      {effectiveStatus !== OrderStatus.CANCELLED &&
        effectiveStatus !== OrderStatus.RETURNED && (
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="relative flex items-center justify-between">
                <div className="bg-muted absolute top-4 right-0 left-0 z-0 h-1">
                  <div
                    className="h-1 bg-green-500 transition-all duration-300"
                    style={{
                      width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%`,
                    }}
                  />
                </div>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const Icon =
                    step === OrderStatus.DELIVERED
                      ? CheckCircle2
                      : step === OrderStatus.SHIPPED
                        ? Truck
                        : step === OrderStatus.PLACED
                          ? Clock
                          : Package;
                  return (
                    <div
                      key={step}
                      className="relative z-10 flex flex-col items-center gap-1.5 text-center"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          done
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-muted bg-background text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="hidden text-[10px] font-medium sm:block">
                        {step.replace(/_/g, ' ')}
                      </span>
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
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent className="divide-muted divide-y">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              <div className="bg-muted border-muted h-16 w-16 flex-shrink-0 rounded-lg border" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product?.name ?? 'Product'}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-semibold">
                ₹{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="text-foreground flex justify-between pt-4 text-base font-bold">
            <span>Total Amount</span>
            <span>₹{order.totalAmount.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="text-primary h-5 w-5" aria-hidden="true" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            <p className="text-foreground font-medium">{order.shippingAddress}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
