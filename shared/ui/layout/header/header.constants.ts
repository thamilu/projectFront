import type { NavItem, DialogTarget } from './header.types';
import { APP_ROUTES } from '@/shared/routes';

export const DIALOG_TARGET = {
  CART: 'cart',
  WISHLIST: 'wishlist',
} as const satisfies Record<string, DialogTarget>;

export const DEFAULT_NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: APP_ROUTES.PRODUCTS, label: 'Products' },
  { href: '#deals', label: 'Deals' },
] as const;
