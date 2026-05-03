'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Heart,
  Target,
  AlertTriangle,
  DollarSign,
  Package,
  Star
} from 'lucide-react';
import { StatsCard } from '@/components/ui/stats-card';

// Mock analytics data
const analyticsData = {
  spending: {
    totalSpent: 2450.78,
    monthlySpent: 540.95,
    averageOrder: 89.99,
    spendingTrend: 12.5,
    monthlyData: [
      { month: 'Jan', amount: 320.50 },
      { month: 'Feb', amount: 450.20 },
      { month: 'Mar', amount: 290.80 },
      { month: 'Apr', amount: 680.45 },
      { month: 'May', amount: 540.95 }
    ]
  },
  categories: [
    { name: 'Electronics', spent: 890.45, orders: 8, percentage: 36 },
    { name: 'Fashion', spent: 650.20, orders: 12, percentage: 27 },
    { name: 'Home & Garden', spent: 420.80, orders: 6, percentage: 17 },
    { name: 'Books', spent: 280.15, orders: 15, percentage: 11 },
    { name: 'Sports', spent: 209.18, orders: 4, percentage: 9 }
  ],
  orders: {
    totalOrders: 45,
    completedOrders: 42,
    averageDeliveryTime: 3.2,
    orderTrend: 8.3,
    recentOrders: [
      { id: 'ORD-001', date: '2024-12-01', amount: 299.99, status: 'delivered' },
      { id: 'ORD-002', date: '2024-11-28', amount: 149.99, status: 'shipped' },
      { id: 'ORD-003', date: '2024-11-25', amount: 89.99, status: 'delivered' }
    ]
  },
  recommendations: [
    {
      id: 1,
      title: 'Based on Electronics purchases',
      products: ['Smart Home Hub', 'Wireless Charger', 'Bluetooth Earbuds'],
      reason: 'Similar to your recent tech purchases'
    },
    {
      id: 2,
      title: 'Trending in Fashion',
      products: ['Winter Jacket', 'Designer Sneakers', 'Casual Shirt'],
      reason: 'Popular items in your size and style'
    }
  ],
  budget: {
    monthlyBudget: 600.00,
    spent: 540.95,
    remaining: 59.05,
    daysLeft: 15,
    onTrack: true
  },
  wishlist: {
    totalItems: 23,
    priceDrops: 5,
    totalValue: 1890.45,
    averagePrice: 82.19
  }
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'spending', label: 'Spending', icon: DollarSign },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'recommendations', label: 'Recommendations', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-3xl font-bold">My Analytics</h1>
          </div>
          
          <div className="flex gap-2">
            {['1month', '3months', '6months', '1year'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period.replace('months', 'M').replace('month', 'M').replace('year', 'Y')}
              </Button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Spent"
                value={`$${analyticsData.spending.totalSpent.toFixed(2)}`}
                description="Last 6 months"
                icon={<DollarSign className="h-4 w-4" />}
                trend={{ value: analyticsData.spending.spendingTrend, isPositive: false }}
              />
              
              <StatsCard
                title="Total Orders"
                value={analyticsData.orders.totalOrders}
                description="Lifetime orders"
                icon={<Package className="h-4 w-4" />}
                trend={{ value: analyticsData.orders.orderTrend, isPositive: true }}
              />
              
              <StatsCard
                title="Average Order"
                value={`$${analyticsData.spending.averageOrder.toFixed(2)}`}
                description="Per order value"
                icon={<ShoppingBag className="h-4 w-4" />}
              />
              
              <StatsCard
                title="Wishlist Value"
                value={`$${analyticsData.wishlist.totalValue.toFixed(2)}`}
                description={`${analyticsData.wishlist.totalItems} items`}
                icon={<Heart className="h-4 w-4" />}
              />
            </div>

            {/* Budget Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Monthly Budget Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Budget Progress</span>
                    <span className="font-semibold">
                      ${analyticsData.budget.spent.toFixed(2)} / ${analyticsData.budget.monthlyBudget.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        analyticsData.budget.onTrack ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(analyticsData.budget.spent / analyticsData.budget.monthlyBudget) * 100}%`
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex items-center gap-1 ${
                      analyticsData.budget.onTrack ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analyticsData.budget.onTrack ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {analyticsData.budget.onTrack ? 'On track' : 'Over budget'}
                    </span>
                    <span className="text-muted-foreground">
                      ${analyticsData.budget.remaining.toFixed(2)} remaining ({analyticsData.budget.daysLeft} days left)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categories.map((category) => (
                    <div key={category.name} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">{category.name}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">
                            ${category.spent.toFixed(2)} • {category.orders} orders
                          </span>
                          <span className="text-sm font-medium">{category.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Spending Tab */}
        {activeTab === 'spending' && (
          <div className="space-y-6">
            {/* Spending Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="This Month"
                value={`$${analyticsData.spending.monthlySpent.toFixed(2)}`}
                description="Current month spending"
                trend={{ value: analyticsData.spending.spendingTrend, isPositive: false }}
              />
              
              <StatsCard
                title="Average Monthly"
                value={`$${(analyticsData.spending.totalSpent / 6).toFixed(2)}`}
                description="6-month average"
              />
              
              <StatsCard
                title="Highest Month"
                value="$680.45"
                description="April 2024"
              />
            </div>

            {/* Monthly Spending Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.spending.monthlyData.map((month) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium">{month.month}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="w-full bg-gray-200 rounded-full h-6 relative">
                            <div
                              className="h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end pr-2"
                              style={{ width: `${(month.amount / 700) * 100}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                ${month.amount.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Total Orders"
                value={analyticsData.orders.totalOrders}
                description="Lifetime orders"
              />
              
              <StatsCard
                title="Completed"
                value={analyticsData.orders.completedOrders}
                description={`${Math.round((analyticsData.orders.completedOrders / analyticsData.orders.totalOrders) * 100)}% success rate`}
              />
              
              <StatsCard
                title="Avg Delivery"
                value={`${analyticsData.orders.averageDeliveryTime} days`}
                description="Average delivery time"
              />
              
              <StatsCard
                title="This Month"
                value="8"
                description="Current month orders"
                trend={{ value: 15.2, isPositive: true }}
              />
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.orders.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${order.amount.toFixed(2)}</div>
                        <Badge 
                          className={`${
                            order.status === 'delivered' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="space-y-6">
              {analyticsData.recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      {rec.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{rec.reason}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {rec.products.map((product, index) => (
                        <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3"></div>
                          <div className="font-medium text-sm">{product}</div>
                          <div className="text-xs text-muted-foreground mt-1">Recommended for you</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trending Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending in Your Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['Wireless Charger', 'Smart Bulb', 'Fitness Tracker', 'Bluetooth Speaker'].map((product, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3"></div>
                      <div className="font-medium text-sm">{product}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Popular</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}