'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Search,
  Eye,
  Download,
  Star
} from 'lucide-react';

// Mock order data
const mockOrders = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15',
    status: 'delivered',
    total: 539.95,
    items: 3,
    deliveryDate: '2024-01-18',
    trackingNumber: 'TRK123456789',
    items_detail: [
      { name: 'Wireless Headphones', quantity: 2, price: 99.99, image: '/placeholder-1.jpg' },
      { name: 'Smart Watch', quantity: 1, price: 299.99, image: '/placeholder-2.jpg' }
    ]
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-20',
    status: 'shipped',
    total: 149.99,
    items: 1,
    estimatedDelivery: '2024-01-23',
    trackingNumber: 'TRK987654321',
    items_detail: [
      { name: 'Bluetooth Speaker', quantity: 1, price: 149.99, image: '/placeholder-3.jpg' }
    ]
  },
  {
    id: 'ORD-2024-003',
    date: '2024-01-22',
    status: 'processing',
    total: 79.99,
    items: 1,
    estimatedDelivery: '2024-01-25',
    items_detail: [
      { name: 'Phone Case', quantity: 1, price: 79.99, image: '/placeholder-4.jpg' }
    ]
  }
];

const statusConfig = {
  processing: { 
    label: 'Processing', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock 
  },
  shipped: { 
    label: 'Shipped', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Truck 
  },
  delivered: { 
    label: 'Delivered', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle 
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Package 
  }
};

export default function OrdersPage() {
  const [orders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items_detail.some(item => 
                           item.name.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const orderDetails = selectedOrder ? orders.find(o => o.id === selectedOrder) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Package className="h-6 w-6" />
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Badge variant="secondary" className="ml-2">
            {orders.length} orders
          </Badge>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by order ID or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'processing' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('processing')}
                  size="sm"
                >
                  Processing
                </Button>
                <Button
                  variant={statusFilter === 'shipped' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('shipped')}
                  size="sm"
                >
                  Shipped
                </Button>
                <Button
                  variant={statusFilter === 'delivered' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('delivered')}
                  size="sm"
                >
                  Delivered
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Orders List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No orders found</h2>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters.'
                      : "You haven't placed any orders yet."}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button>Start Shopping</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedOrder === order.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.id}</h3>
                        <p className="text-muted-foreground">
                          Placed on {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total</span>
                        <div className="font-semibold">${order.total.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Items</span>
                        <div className="font-semibold">{order.items} items</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {order.status === 'delivered' ? 'Delivered' : 'Est. Delivery'}
                        </span>
                        <div className="font-semibold">
                          {order.deliveryDate || order.estimatedDelivery 
                            ? new Date(order.deliveryDate || order.estimatedDelivery!).toLocaleDateString()
                            : 'Pending'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Product Images Preview */}
                    <div className="flex gap-2 mt-4">
                      {order.items_detail.slice(0, 3).map((item, index) => (
                        <div key={index} className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex-shrink-0">
                          {/* Placeholder for product image */}
                        </div>
                      ))}
                      {order.items_detail.length > 3 && (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs font-medium">
                          +{order.items_detail.length - 3}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {order.status === 'shipped' && (
                        <Button variant="outline" size="sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          Track Order
                        </Button>
                      )}
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          <Star className="w-4 h-4 mr-2" />
                          Review
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
            {orderDetails ? (
              <>
                {/* Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="font-semibold">{orderDetails.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(orderDetails.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {orderDetails.trackingNumber && (
                      <div>
                        <div className="text-sm text-muted-foreground">Tracking Number</div>
                        <div className="font-mono text-sm">{orderDetails.trackingNumber}</div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="mt-1">
                        {getStatusBadge(orderDetails.status)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-semibold text-lg">${orderDetails.total.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Items ({orderDetails.items_detail.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderDetails.items_detail.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex-shrink-0">
                            {/* Placeholder for product image */}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </div>
                            <div className="font-semibold">${item.price.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                      
                      {orderDetails.status === 'delivered' && (
                        <>
                          <Button variant="outline" className="w-full" size="sm">
                            Return Items
                          </Button>
                          <Button variant="outline" className="w-full" size="sm">
                            <Star className="w-4 h-4 mr-2" />
                            Write Review
                          </Button>
                        </>
                      )}
                      
                      {orderDetails.status === 'processing' && (
                        <Button variant="outline" className="w-full" size="sm">
                          Cancel Order
                        </Button>
                      )}
                      
                      <Button variant="outline" className="w-full" size="sm">
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Select an order to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}