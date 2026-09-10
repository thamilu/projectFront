export interface SellerDashboardResponse {
  storeOverview?: {
    storeName?: string;
    storeStatus?: string;
    totalProducts?: number;
    activeProducts?: number;
    outOfStockProducts?: number;
    storeRating?: number;
  };
  shopOverview?: {
    totalProducts?: number;
    outOfStockProducts?: number;
  };
  salesMetrics?: {
    todaySales?: number;
    weeklySales?: number;
    monthlySales?: number;
    totalSales?: number;
  };
  orderManagement?: {
    newOrders?: number;
    processingOrders?: number;
    shippedOrders?: number;
    completedOrders?: number;
  };
  topProducts?: Array<{
    productId?: number;
    productName?: string;
    currentPrice?: number;
    stockQuantity?: number;
  }>;
}
