export interface SellerDashboardResponse {
  shopOverview: {
    totalProducts: number;
    outOfStockProducts: number;
  };
  orderManagement: {
    newOrders: number;
  };
  topProducts: Array<{
    productId: number;
    productName: string;
    currentPrice: number;
    stockQuantity: number;
  }>;
}
