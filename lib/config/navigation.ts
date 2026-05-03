/**
 * Navigation Configuration
 *
 * Centralized navigation items for the application.
 *
 * @module lib/config/navigation
 */

import { APP_ROUTES } from '@/constants/routes/app-routes';

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
    { title: 'Dashboard', href: '/customer/dashboard' },
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
  footer: [
    {
      title: 'Company',
      items: [
        { title: 'About Us', href: APP_ROUTES.ABOUT },
        { title: 'Careers', href: '/careers' },
        { title: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Support',
      items: [
        { title: 'Help Center', href: APP_ROUTES.HELP },
        { title: 'Contact Us', href: APP_ROUTES.CONTACT },
        { title: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { title: 'Privacy Policy', href: APP_ROUTES.PRIVACY },
        { title: 'Terms of Service', href: APP_ROUTES.TERMS },
        { title: 'Cookie Policy', href: '/cookies' },
      ],
    },
  ],
} as const;
