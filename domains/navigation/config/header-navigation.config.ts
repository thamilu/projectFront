import { APP_ROUTES } from '@/shared/routes';
import type { AnnouncementCampaign, NavigationItem } from '../contracts/navigation.types';
import { ShoppingBag, Heart, HelpCircle, Truck, RotateCcw } from 'lucide-react';

export const DEFAULT_ANNOUNCEMENT_CAMPAIGNS: AnnouncementCampaign[] = [
  {
    id: 'campaign-free-shipping-flash-sale',
    text: 'Free Shipping Over ₹500 • Flash Sale: Up to 70% Off • 100% Secure Checkout',
    badge: 'Limited Offer',
    href: '/deals',
    priority: 1,
    persistDismissal: true,
  },
];

export const UTILITY_NAV_LINKS: NavigationItem[] = [
  {
    id: 'help-support',
    label: 'Help & Support',
    href: '/help',
    Icon: HelpCircle,
  },
  {
    id: 'track-order',
    label: 'Track Order',
    href: '/orders/track',
    Icon: Truck,
  },
  {
    id: 'returns-refunds',
    label: 'Returns',
    href: '/help/returns',
    Icon: RotateCcw,
  },
];

export const PRIMARY_NAV_LINKS: NavigationItem[] = [
  {
    id: 'nav-products',
    label: 'Products',
    href: APP_ROUTES.PRODUCTS,
  },
  {
    id: 'nav-deals',
    label: 'Deals',
    href: APP_ROUTES.DEALS,
  },
];

export const CUSTOMER_MENU_LINKS: NavigationItem[] = [
  {
    id: 'menu-orders',
    label: 'My Orders',
    href: APP_ROUTES.ORDERS,
    Icon: ShoppingBag,
  },
  {
    id: 'menu-wishlist',
    label: 'Wishlist',
    href: APP_ROUTES.WISHLIST,
    Icon: Heart,
  },
];

export interface SearchCategoryOption {
  id: string;
  label: string;
  value: string;
}

export const SEARCH_CATEGORY_OPTIONS: SearchCategoryOption[] = [
  { id: 'cat-all', label: 'All Categories', value: 'all' },
  { id: 'cat-electronics', label: 'Electronics', value: 'electronics' },
  { id: 'cat-fashion', label: 'Fashion', value: 'fashion' },
  { id: 'cat-home-living', label: 'Home & Living', value: 'home-living' },
  { id: 'cat-sports', label: 'Sports', value: 'sports' },
  { id: 'cat-gaming', label: 'Gaming', value: 'gaming' },
  { id: 'cat-jewellery', label: 'Jewellery', value: 'jewellery' },
];
