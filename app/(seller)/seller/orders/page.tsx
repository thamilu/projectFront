'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/atoms/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Eye, MoreHorizontal, Package, Truck, AlertCircle, RotateCcw, Download } from 'lucide-react';
import { OrderStatus } from '@/domains/order/contracts/order.types';
import { APP_ROUTES } from '@/shared/routes';
import { useSellerOrders, useUpdateOrderStatus } from '@/features/orders/hooks/use-orders';

const PAGE_SIZE = 20;

// A seller only ever advances an order forward through fulfillment — they
// never cancel a customer's order (that's the customer's own action, via
// app/(customer)/orders). PLACED/CONFIRMED orders can be marked PACKED;
// PACKED orders can be marked SHIPPED.
const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  [OrderStatus.PLACED]: { label: 'Mark as Packed', status: OrderStatus.PACKED },
  [OrderStatus.CONFIRMED]: { label: 'Mark as Packed', status: OrderStatus.PACKED },
  [OrderStatus.PACKED]: { label: 'Mark as Shipped', status: OrderStatus.SHIPPED },
};

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PLACED:
      return <Badge variant="secondary">Placed</Badge>;
    case OrderStatus.CONFIRMED:
      return <Badge className="bg-blue-500">Confirmed</Badge>;
    case OrderStatus.PACKED:
      return <Badge className="bg-purple-500">Packed</Badge>;
    case OrderStatus.SHIPPED:
      return <Badge className="bg-orange-500">Shipped</Badge>;
    case OrderStatus.DELIVERED:
      return <Badge className="bg-green-500">Delivered</Badge>;
    case OrderStatus.CANCELLED:
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Quotes a CSV field only when it contains a character that would otherwise break it. */
function csvField(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push(APP_ROUTES.HOME);
      return;
    }
    const roles = (session?.roles || []) as string[];
    if (!roles.includes('SELLER')) {
      router.push(APP_ROUTES.HOME);
    }
  }, [session, status, router]);

  const isAuthorizedSeller =
    status === 'authenticated' && ((session?.roles || []) as string[]).includes('SELLER');

  const { data, isLoading, isError, refetch } = useSellerOrders(
    { page, size: PAGE_SIZE },
    { enabled: isAuthorizedSeller }
  );
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();

  const orders = useMemo(() => data?.content ?? [], [data]);

  const handleExport = () => {
    const header = ['Order #', 'Customer', 'Email', 'Date', 'Status', 'Payment', 'Total'];
    const rows = orders.map((order) => [
      order.orderNumber,
      `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      order.customer.email,
      new Date(order.createdAt).toLocaleDateString(),
      order.orderStatus,
      order.paymentStatus,
      order.totalAmount.toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-page-${page + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading' || (isLoading && isAuthorizedSeller)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <span className="text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:px-6">
        {/* Plain <div>: the root layout owns the only main landmark. */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <Button onClick={handleExport} disabled={orders.length === 0}>
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export Orders
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Manage your shop&apos;s orders and shipments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isError ? (
                <div
                  className="flex flex-col items-center gap-4 py-10 text-center"
                  data-testid="seller-orders-error"
                >
                  <AlertCircle className="text-destructive h-10 w-10" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">Couldn&apos;t load your orders</p>
                    <p className="text-muted-foreground text-sm">
                      Please check your connection and try again.
                    </p>
                  </div>
                  <Button onClick={() => refetch()} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Retry
                  </Button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-muted-foreground py-10 text-center">No orders found.</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const nextAction = NEXT_STATUS[order.orderStatus];
                        return (
                          <Fragment key={order.id}>
                            <TableRow>
                              <TableCell className="font-medium">{order.orderNumber}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>
                                    {order.customer.firstName} {order.customer.lastName}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {order.customer.email}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                              <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setExpandedId((id) => (id === order.id ? null : order.id))
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                                      View Details
                                    </DropdownMenuItem>
                                    {nextAction && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          disabled={isUpdatingStatus}
                                          onSelect={() =>
                                            updateStatus({ id: order.id, status: nextAction.status })
                                          }
                                        >
                                          {nextAction.status === OrderStatus.PACKED ? (
                                            <Package className="mr-2 h-4 w-4" aria-hidden="true" />
                                          ) : (
                                            <Truck className="mr-2 h-4 w-4" aria-hidden="true" />
                                          )}
                                          {nextAction.label}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {expandedId === order.id && (
                              <TableRow>
                                <TableCell colSpan={6} className="bg-muted/30">
                                  <div className="space-y-3 py-2">
                                    <div>
                                      <p className="text-sm font-medium">Shipping Address</p>
                                      <p className="text-muted-foreground text-sm">
                                        {order.shippingAddress}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        Items ({order.items.length})
                                      </p>
                                      <ul className="text-muted-foreground mt-1 space-y-1 text-sm">
                                        {order.items.map((item) => (
                                          <li key={item.id}>
                                            {item.quantity} × {item.product?.name ?? 'Product'} — $
                                            {item.subtotal.toFixed(2)}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {data && data.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-muted-foreground text-sm">
                        Page {data.number + 1} of {data.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.first}
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.last}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
