'use client';

import { useSession } from 'next-auth/react';
import { env } from '@/env';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/atoms/card';
import { Badge } from '@/shared/ui/atoms/badge';
import { Button } from '@/shared/ui/atoms/button';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/atoms/table';
import { apiClient } from '@/core/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/atoms/dropdown-menu';
import { Eye, MoreHorizontal, Package, Truck } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '@/domains/order/contracts/order.types';
import { logger } from '@/core/telemetry/logger';
import { APP_ROUTES } from '@/shared/constants/routes/app-routes';

// Interface matching Backend OrderResponse
interface SellerOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  items: any[]; // define stricter if needed
  totalAmount: number;
  shippingAddress: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

// Mock data for development when API is not ready
const MOCK_ORDERS: SellerOrder[] = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    customerId: 101,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    items: [],
    totalAmount: 156.0,
    shippingAddress: '123 Main St, Anytown, USA',
    orderStatus: OrderStatus.PLACED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    customerId: 102,
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    items: [],
    totalAmount: 89.5,
    shippingAddress: '456 Oak Ave, Somewhere, CA',
    orderStatus: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    orderNumber: 'ORD-2024-003',
    customerId: 103,
    customerName: 'Bob Jones',
    customerEmail: 'bob@example.com',
    items: [],
    totalAmount: 210.0,
    shippingAddress: '789 Pine Ln, Nowhere, NY',
    orderStatus: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push(APP_ROUTES.HOME);
      return;
    }

    const roles = (session?.roles || []) as string[];
    if (!roles.includes('SELLER')) {
      router.push(APP_ROUTES.HOME);
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const { data: result } = await apiClient.get<any>(`/api/v1/orders/seller`);

      if (result?.success && result.data && Array.isArray(result.data.data)) {
        setOrders(result.data.data);
      } else if (result?.content && Array.isArray(result.content)) {
        setOrders(result.content);
      } else if (result?.data && Array.isArray(result.data)) {
        setOrders(result.data);
      } else {
        logger.warn('[Seller/Orders] Unexpected response structure:', result);
        setOrders([]);
      }
    } catch (err: any) {
      console.error('[Seller/Orders] Fetch failed', err);
      setOrders(MOCK_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    // Helper to safely handle potential string values that might not strictly match enum at runtime
    const normalizedStatus = status as string;

    switch (normalizedStatus) {
      case OrderStatus.PLACED:
      case 'PLACED':
        return <Badge variant="secondary">Placed</Badge>;
      case OrderStatus.CONFIRMED:
      case 'CONFIRMED':
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case OrderStatus.PACKED:
      case 'PACKED':
        return <Badge className="bg-purple-500">Packed</Badge>;
      case OrderStatus.SHIPPED:
      case 'SHIPPED':
        return <Badge className="bg-orange-500">Shipped</Badge>;
      case OrderStatus.DELIVERED:
      case 'DELIVERED':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case OrderStatus.CANCELLED:
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:px-6">
        <main className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <Button>Export Orders</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Manage your shop&apos;s orders and shipments.</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-muted-foreground py-10 text-center">No orders found.</div>
              ) : (
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
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{order.customerName}</span>
                            <span className="text-muted-foreground text-xs">
                              {order.customerEmail}
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
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Mark as Packed
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" />
                                Mark as Shipped
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
