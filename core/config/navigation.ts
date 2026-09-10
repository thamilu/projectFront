/**
 * Navigation Configuration
 *
 * Centralized navigation items for the application.
 *
 * @module lib/config/navigation
 */

import { APP_ROUTES } from '@/shared/routes';

export type NavItem = {
  title: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigationConfig = {
  main: [
    { title: 'Home', href: '/' },
    { title: 'Products', href: APP_ROUTES.PRODUCTS },
    { title: 'About', href: APP_ROUTES.ABOUT },
    { title: 'Contact', href: APP_ROUTES.CONTACT },
  ],
  customer: [
    // No dedicated /customer/dashboard page exists — APP_ROUTES.DASHBOARD
    // is the real role-based redirect hub.
    { title: 'Dashboard', href: APP_ROUTES.DASHBOARD },
    { title: 'Orders', href: APP_ROUTES.ORDERS },
    { title: 'Wishlist', href: '/wishlist' },
    { title: 'Cart', href: APP_ROUTES.CART },
    { title: 'Settings', href: '/settings' },
  ],
  seller: [
    { title: 'Dashboard', href: APP_ROUTES.SELLER.DASHBOARD },
    { title: 'My Products', href: APP_ROUTES.SELLER.PRODUCTS },
    { title: 'Orders', href: APP_ROUTES.SELLER.ORDERS },
  ],
  /**
   * Site footer sections.
   *
   * [INVARIANT] Every href here must resolve to a real route. This list
   * previously contained four links to pages that do not exist — /careers,
   * /blog, /faq and /cookies — which was harmless only because nothing
   * rendered it: the application had no footer at all. Now that it does, a
   * dead entry here is a visible 404 on every page, so entries are added only
   * once the destination exists.
   */
  footer: [
    {
      title: 'Shop',
      items: [
        { title: 'All Products', href: APP_ROUTES.PRODUCTS },
        { title: 'Categories', href: APP_ROUTES.CATEGORIES },
        { title: 'Deals', href: APP_ROUTES.DEALS },
        { title: 'Stores', href: APP_ROUTES.STORES.LIST },
      ],
    },
    {
      title: 'Company',
      items: [{ title: 'About Us', href: APP_ROUTES.ABOUT }],
    },
    {
      title: 'Support',
      items: [
        { title: 'Help Center', href: APP_ROUTES.HELP },
        { title: 'Contact Us', href: APP_ROUTES.CONTACT },
        { title: 'Track an Order', href: APP_ROUTES.ORDERS },
      ],
    },
    {
      title: 'Legal',
      items: [
        { title: 'Privacy Policy', href: APP_ROUTES.PRIVACY },
        { title: 'Terms of Service', href: APP_ROUTES.TERMS },
      ],
    },
  ],
} as const;
