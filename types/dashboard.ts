export interface DashboardOverview {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  totalShops: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface UserStats {
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  activeUsers: number;
  churnRate: number;
  growthRate: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

export interface PaymentAnalytics {
  successRate: number;
  failedTransactions: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  methods: PaymentMethodStats[];
}

export interface PaymentMethodStats {
  method: string;
  displayName: string;
  percentage: number;
  transactions: number;
  volume: number;
  icon?: string;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  currentStock: number;
  threshold: number;
  status: 'low' | 'critical' | 'out_of_stock';
  lastRestocked?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  image?: string;
  sales: number;
  revenue: number;
  growth: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface AdminDashboardData {
  overview: DashboardOverview;
  userStats: UserStats;
  recentOrders: RecentOrder[];
  paymentAnalytics: PaymentAnalytics;
  alerts: SystemAlert[];
  inventoryAlerts: InventoryAlert[];
  topProducts: TopProduct[];
  revenueData: RevenueDataPoint[];
  lastUpdated: string;
}

export interface DateRange {
  from: Date;
  to: Date;
  preset?: DateRangePreset;
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';
