'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Check, 
  X, 
  Package, 
  CreditCard,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Settings,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    type: 'order',
    title: 'Order Shipped',
    message: 'Your order #ORD-2024-001 has been shipped and will arrive in 2-3 days.',
    timestamp: '2024-12-01T10:30:00Z',
    read: false,
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment Successful',
    message: 'Payment of $539.95 has been processed successfully.',
    timestamp: '2024-12-01T09:15:00Z',
    read: false,
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 3,
    type: 'wishlist',
    title: 'Price Drop Alert',
    message: 'Wireless Headphones Pro is now $299.99 (was $349.99) - 14% off!',
    timestamp: '2024-12-01T08:45:00Z',
    read: true,
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 4,
    type: 'cart',
    title: 'Cart Reminder',
    message: 'You have 3 items in your cart. Complete your purchase before they sell out!',
    timestamp: '2024-11-30T18:20:00Z',
    read: true,
    icon: ShoppingCart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 5,
    type: 'security',
    title: 'New Login Detected',
    message: 'Someone logged into your account from a new device in New York, NY.',
    timestamp: '2024-11-30T14:30:00Z',
    read: false,
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
];

const notificationCategories = [
  { id: 'all', label: 'All Notifications', count: mockNotifications.length },
  { id: 'order', label: 'Orders', count: mockNotifications.filter(n => n.type === 'order').length },
  { id: 'payment', label: 'Payments', count: mockNotifications.filter(n => n.type === 'payment').length },
  { id: 'wishlist', label: 'Wishlist', count: mockNotifications.filter(n => n.type === 'wishlist').length },
  { id: 'security', label: 'Security', count: mockNotifications.filter(n => n.type === 'security').length }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      orders: true,
      payments: true,
      wishlist: true,
      promotions: false,
      security: true
    },
    push: {
      orders: true,
      payments: true,
      wishlist: false,
      promotions: false,
      security: true
    },
    sms: {
      orders: false,
      payments: true,
      wishlist: false,
      promotions: false,
      security: true
    }
  });

  const filteredNotifications = notifications.filter(notification => 
    activeCategory === 'all' || notification.type === activeCategory
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - notifTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const updateNotificationSetting = (channel: string, type: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel as keyof typeof prev],
        [type]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {notificationCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        activeCategory === category.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.label}</span>
                        <Badge variant="outline">{category.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No notifications</h2>
                  <p className="text-muted-foreground">
                    {activeCategory === 'all' 
                      ? "You're all caught up! No new notifications."
                      : `No ${activeCategory} notifications found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <Card 
                      key={notification.id} 
                      className={`transition-all hover:shadow-md ${
                        !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${notification.bgColor}`}>
                            <Icon className={`w-5 h-5 ${notification.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {getTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                            
                            <p className={`text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-3">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Mark as read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification Preferences</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Communication Channels */}
              <div>
                <h3 className="font-semibold mb-4">Communication Channels</h3>
                
                {/* Email Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Email Notifications</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                    {Object.entries(notificationSettings.email).map(([type, enabled]) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => updateNotificationSetting('email', type, e.target.checked)}
                          className="rounded"
                        />
                        <span className="capitalize text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Push Notifications</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                    {Object.entries(notificationSettings.push).map(([type, enabled]) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => updateNotificationSetting('push', type, e.target.checked)}
                          className="rounded"
                        />
                        <span className="capitalize text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* SMS Notifications */}
                <div className="space-y-4 mt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">SMS Notifications</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                    {Object.entries(notificationSettings.sms).map(([type, enabled]) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => updateNotificationSetting('sms', type, e.target.checked)}
                          className="rounded"
                        />
                        <span className="capitalize text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Frequency Settings */}
              <div>
                <h3 className="font-semibold mb-4">Frequency Preferences</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Frequency</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="instant">Instant</option>
                      <option value="daily">Daily digest</option>
                      <option value="weekly">Weekly summary</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Price Drop Alerts</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="instant">Instant</option>
                      <option value="daily">Once per day</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1">
                  Save Preferences
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}