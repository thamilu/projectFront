'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/atoms/card';
import { Button } from '@/shared/ui/atoms/button';
import { Input } from '@/shared/ui/atoms/input';
import { Badge } from '@/shared/ui/atoms/badge';
import { Skeleton } from '@/shared/ui/atoms/skeleton';
import { ConfirmDialog } from '@/shared/ui/molecules/ConfirmDialog';
import { APP_ROUTES } from '@/shared/routes';
import { useOrders, useCancelOrder } from '@/features/orders/hooks/use-orders';
import { OrderStatus, type OrderDTO } from '@/domains/order/contracts/order.types';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Eye,
  Download,
  Star,
  AlertCircle,
  RotateCcw,
  Ban,
} from 'lucide-react';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  [OrderStatus.PLACED]: {
    label: 'Placed',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
  },
  [OrderStatus.PACKED]: {
    label: 'Packed',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Package,
  },
  [OrderStatus.SHIPPED]: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
  },
  [OrderStatus.DELIVERED]: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Ban,
  },
  [OrderStatus.RETURNED]: {
    label: 'Returned',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: RotateCcw,
  },
};

// A customer can only back out before the order has left the warehouse —
// once it's PACKED/SHIPPED, cancellation has to go through support instead.
const CANCELLABLE_STATUSES: OrderStatus[] = [OrderStatus.PLACED, OrderStatus.CONFIRMED];

const FILTERS: Array<{ label: string; value: OrderStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Placed', value: OrderStatus.PLACED },
  { label: 'Shipped', value: OrderStatus.SHIPPED },
  { label: 'Delivered', value: OrderStatus.DELIVERED },
  { label: 'Cancelled', value: OrderStatus.CANCELLED },
];

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OrderDTO | null>(null);

  const { data, isLoading, isError, refetch } = useOrders({
    page: 0,
    size: PAGE_SIZE,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const orders = useMemo(() => data?.content ?? [], [data]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some((item) => item.product?.name?.toLowerCase().includes(query))
    );
  }, [orders, searchQuery]);

  const selectedOrder = selectedOrderId
    ? (orders.find((o) => o.id === selectedOrderId) ?? null)
    : null;

  const getStatusBadge = (status: OrderStatus) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
        {config.label}
      </Badge>
    );
  };

  // Confirmation is handled by the shared ConfirmDialog rendered at the
  // bottom of this component (the same dialog used for wishlist bulk-clear
  // and review deletion elsewhere in the app) rather than window.confirm(),
  // so cancelling an order matches the rest of the app's destructive-action
  // UX and keeps a visible pending state while the mutation is in flight.
  const handleCancelOrder = (order: OrderDTO) => {
    setCancelTarget(order);
  };

  const confirmCancelOrder = () => {
    if (!cancelTarget) return;
    cancelOrder(cancelTarget.id, { onSuccess: () => setCancelTarget(null) });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-2">
          <Package className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-3xl font-bold">My Orders</h1>
          {!isLoading && !isError && (
            <Badge variant="secondary" className="ml-2">
              {data?.totalElements ?? orders.length} orders
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search by order number or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search orders"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={statusFilter === filter.value ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(filter.value)}
                    size="sm"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4" data-testid="orders-loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-6">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/20 bg-destructive/5" data-testid="orders-error">
            <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
              <AlertCircle className="text-destructive h-10 w-10" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold">Couldn&apos;t load your orders</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Please check your connection and try again.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Orders List */}
            <div className="space-y-4 lg:col-span-2">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="text-muted-foreground mx-auto mb-4 h-16 w-16" aria-hidden="true" />
                    <h2 className="mb-2 text-xl font-semibold">No orders found</h2>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : "You haven't placed any orders yet."}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button asChild>
                        <Link href={APP_ROUTES.PRODUCTS}>Start Shopping</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedOrderId === order.id ? 'ring-primary ring-2' : ''
                    }`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                          <p className="text-muted-foreground">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(order.orderStatus)}
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">Total</span>
                          <div className="font-semibold">₹{order.totalAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Items</span>
                          <div className="font-semibold">{order.items.length} items</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment</span>
                          <div className="font-semibold">{order.paymentStatus}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={APP_ROUTES.ORDER_DETAIL(String(order.id))}>
                            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            View Details
                          </Link>
                        </Button>
                        {order.orderStatus === OrderStatus.SHIPPED && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={APP_ROUTES.ORDER_TRACK(String(order.id))}>
                              <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
                              Track Order
                            </Link>
                          </Button>
                        )}
                        {CANCELLABLE_STATUSES.includes(order.orderStatus) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() => handleCancelOrder(order)}
                          >
                            <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Order Details Sidebar */}
            <div className="space-y-6">
              {selectedOrder ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="font-semibold">#{selectedOrder.orderNumber}</div>
                        <div className="text-muted-foreground text-sm">
                          {new Date(selectedOrder.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground text-sm">Status</div>
                        <div className="mt-1">{getStatusBadge(selectedOrder.orderStatus)}</div>
                      </div>

                      <div>
                        <div className="text-muted-foreground text-sm">Total</div>
                        <div className="text-lg font-semibold">
                          ₹{selectedOrder.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Items ({selectedOrder.items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-3">
                            <div className="h-16 w-16 flex-shrink-0 rounded bg-gradient-to-br from-gray-100 to-gray-200" />
                            <div className="flex-1">
                              <div className="font-medium">{item.product?.name ?? 'Product'}</div>
                              <div className="text-muted-foreground text-sm">
                                Quantity: {item.quantity}
                              </div>
                              <div className="font-semibold">₹{item.price.toLocaleString()}</div>
                              {selectedOrder.orderStatus === OrderStatus.DELIVERED &&
                                item.product && (
                                  <Link
                                    href={`/products/${item.product.urlSlug || item.product.id}/reviews`}
                                    className="text-primary mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                                  >
                                    <Star className="h-3 w-3" aria-hidden="true" />
                                    Write a review
                                  </Link>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-2 p-4">
                      <Button variant="outline" className="w-full" size="sm" asChild>
                        <Link href={APP_ROUTES.ORDER_INVOICE(String(selectedOrder.id))}>
                          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                          Download Invoice
                        </Link>
                      </Button>

                      {selectedOrder.orderStatus === OrderStatus.DELIVERED && (
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link href={APP_ROUTES.ORDER_RETURN(String(selectedOrder.id))}>
                            Return Items
                          </Link>
                        </Button>
                      )}

                      {CANCELLABLE_STATUSES.includes(selectedOrder.orderStatus) && (
                        <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          disabled={isCancelling}
                          onClick={() => handleCancelOrder(selectedOrder)}
                        >
                          Cancel Order
                        </Button>
                      )}

                      <Button variant="outline" className="w-full" size="sm" asChild>
                        <Link href={APP_ROUTES.CONTACT}>Contact Support</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="text-muted-foreground mx-auto mb-3 h-12 w-12" aria-hidden="true" />
                    <p className="text-muted-foreground">Select an order to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancel this order?"
        description={
          cancelTarget
            ? `Order #${cancelTarget.orderNumber} will be cancelled. This cannot be undone.`
            : ''
        }
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        destructive
        isLoading={isCancelling}
        onConfirm={confirmCancelOrder}
      />
    </div>
  );
}
