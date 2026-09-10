import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Store,
  Globe,
  User,
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  Percent,
  CreditCard,
  DollarSign,
  LineChart,
} from 'lucide-react';

export interface NavItem {
  titleKey: string;
  defaultTitle: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string;
  matchSubpaths?: boolean;
  group?: 'Dashboard' | 'Catalog' | 'Sales' | 'Customers' | 'Analytics' | 'Marketing' | 'Finance' | 'Settings';
}

/**
 * Returns the primary navigation items for the Seller Sidebar.
 * Items can be conditionally filtered using the user's permissions.
 *
 * @param hasPermission - Function to check if the user has a specific permission
 */
export function getSellerNavigation(hasPermission: (permission: string) => boolean): NavItem[] {
  const items: NavItem[] = [
    {
      titleKey: 'seller.sidebar.nav.dashboard',
      defaultTitle: 'Dashboard',
      href: '/seller/dashboard',
      icon: LayoutDashboard,
      group: 'Dashboard',
    },
    {
      titleKey: 'seller.sidebar.nav.products',
      defaultTitle: 'Products',
      href: '/seller/products',
      icon: Package,
      group: 'Catalog',
    },
    {
      titleKey: 'seller.sidebar.nav.catalog',
      defaultTitle: 'Shared Catalog',
      href: '/seller/catalog',
      icon: Globe,
      group: 'Catalog',
    },
    {
      titleKey: 'seller.sidebar.nav.inventory',
      defaultTitle: 'Inventory',
      href: '/seller/inventory',
      icon: Boxes,
      permission: 'manage_inventory',
      group: 'Catalog',
    },
    {
      titleKey: 'seller.sidebar.nav.orders',
      defaultTitle: 'Orders',
      href: '/seller/orders',
      icon: ShoppingCart,
      permission: 'view_orders',
      group: 'Sales',
    },
    {
      titleKey: 'seller.sidebar.nav.analytics',
      defaultTitle: 'Analytics',
      href: '/seller/analytics',
      icon: BarChart3,
      group: 'Analytics',
    },
    {
      titleKey: 'seller.sidebar.nav.customers',
      defaultTitle: 'Customers',
      href: '/seller/customers',
      icon: Users,
      group: 'Customers',
    },
    {
      titleKey: 'seller.sidebar.nav.messages',
      defaultTitle: 'Messages',
      href: '/seller/messages',
      icon: MessageSquare,
      badge: 8,
      group: 'Customers',
    },
    {
      titleKey: 'seller.sidebar.nav.discounts',
      defaultTitle: 'Discounts',
      href: '/seller/marketing/coupons',
      icon: Percent,
      group: 'Marketing',
    },
    {
      titleKey: 'seller.sidebar.nav.subscription',
      defaultTitle: 'Subscription',
      href: '/seller/subscription',
      icon: CreditCard,
      group: 'Finance',
    },
    {
      titleKey: 'seller.sidebar.nav.finance',
      defaultTitle: 'Finance',
      href: '/seller/finance',
      icon: DollarSign,
      group: 'Finance',
    },
    {
      titleKey: 'seller.sidebar.nav.reports',
      defaultTitle: 'Reports',
      href: '/seller/reports',
      icon: LineChart,
      group: 'Analytics',
    },
    {
      titleKey: 'seller.sidebar.nav.storeProfile',
      defaultTitle: 'Store Profile',
      href: '/seller/store',
      icon: Store,
      group: 'Settings',
    },
  ];

  return items.filter((item) => !item.permission || hasPermission(item.permission));
}

/**
 * Returns the bottom utility navigation items for the Seller Sidebar.
 */
export function getSellerBottomNavigation(): NavItem[] {
  return [
    {
      titleKey: 'seller.sidebar.nav.profile',
      defaultTitle: 'My Profile',
      href: '/seller/profile',
      icon: User,
      group: 'Settings',
    },
    {
      titleKey: 'seller.sidebar.nav.settings',
      defaultTitle: 'Settings',
      href: '/seller/settings',
      icon: Settings,
      group: 'Settings',
    },
    {
      titleKey: 'seller.sidebar.nav.backToShop',
      defaultTitle: 'Back to Shop',
      href: '/', // No /customer/dashboard page exists; storefront home.
      icon: ShoppingCart,
      matchSubpaths: false,
      group: 'Dashboard',
    },
  ];
}
