/**
 * Web App Manifest
 * 
 * Dynamic manifest generation for Progressive Web App support.
 * Defines app metadata, icons, and behavior when installed.
 * 
 * @module app/manifest
 */

import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { APP_ROUTES } from '@/constants/routes/app-routes';

/**
 * Generate Web App Manifest
 * 
 * Provides PWA configuration with:
 * - App name and description
 * - Icons (including maskable for adaptive icons)
 * - Display mode (standalone)
 * - Theme colors
 * - Start URL
 * - Shortcuts for common actions
 * - Screenshots for app stores
 * 
 * @returns Manifest configuration
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'eShop',
    description: siteConfig.description,
    start_url: APP_ROUTES.HOME,
    scope: APP_ROUTES.HOME,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    categories: ['shopping', 'ecommerce', 'business'],
    
    // Icons for different platforms
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable', // For adaptive icons on Android
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    
    // Screenshots for app stores and install prompts
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Homepage',
      },
      {
        src: '/screenshots/products.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Product Catalog',
      },
      {
        src: '/screenshots/cart.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Shopping Cart',
      },
    ],
    
    // Shortcuts for common actions
    shortcuts: [
      {
        name: 'Browse Products',
        short_name: 'Products',
        description: 'View all products',
        url: APP_ROUTES.PRODUCTS,
        icons: [{ src: '/icons/products.png', sizes: '96x96' }],
      },
      {
        name: 'My Cart',
        short_name: 'Cart',
        description: 'View shopping cart',
        url: APP_ROUTES.CART,
        icons: [{ src: '/icons/cart.png', sizes: '96x96' }],
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View order history',
        url: APP_ROUTES.ORDERS,
        icons: [{ src: '/icons/orders.png', sizes: '96x96' }],
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View dashboard',
        url: APP_ROUTES.CUSTOMER.DASHBOARD,
        icons: [{ src: '/icons/dashboard.png', sizes: '96x96' }],
      },
    ],
    
    // No related native apps
    related_applications: [],
    prefer_related_applications: false,
  };
}
