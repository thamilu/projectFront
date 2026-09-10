/**
 * Web App Manifest
 *
 * Dynamic manifest generation for Progressive Web App support.
 * Defines app metadata, icons, and behavior when installed.
 *
 * @module app/manifest
 */

import type { MetadataRoute } from 'next';
import { siteConfig } from '@/core/config/site';
import { APP_ROUTES } from '@/shared/routes';

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
    /**
     * `id` pins the app's identity independently of `start_url`.
     *
     * Without it the browser derives identity from `start_url`, so changing
     * that route later registers a *different* app — existing installs are
     * orphaned rather than updated.
     */
    id: APP_ROUTES.HOME,

    name: siteConfig.name,
    short_name: 'eShop',
    description: siteConfig.description,
    start_url: APP_ROUTES.HOME,
    scope: APP_ROUTES.HOME,
    display: 'standalone',
    background_color: '#ffffff',

    /**
     * Matches the light-scheme `themeColor` in `app/layout.tsx`'s viewport
     * export. These previously disagreed — the manifest said `#000000` while
     * the viewport said `#ffffff` — so an installed PWA's title bar did not
     * match the same app opened in the browser.
     */
    theme_color: '#ffffff',

    orientation: 'portrait-primary',
    categories: ['shopping', 'ecommerce', 'business'],

    /**
     * Only assets that actually exist are declared.
     *
     * Nine of the eleven references here previously pointed at files absent
     * from `public/`: both maskable icons, all three screenshots, and all four
     * shortcut icons. A manifest citing missing assets is not a cosmetic
     * problem — Chrome validates icons when deciding whether to offer
     * installation, and a failed fetch can suppress the install prompt
     * entirely, which is the one thing a manifest exists to enable.
     *
     * [FOLLOW-UP] Maskable icons are intentionally absent rather than faked.
     * A maskable icon is not a resized `any` icon: it needs artwork drawn
     * within the 40% safe zone so Android's adaptive mask cannot crop the mark.
     * Generating one mechanically from the existing square icon would produce a
     * clipped logo on most devices. Add real maskable artwork here once a
     * designer supplies it, together with screenshots for the richer install
     * dialogue.
     */
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],

    /**
     * Shortcuts without `icons`.
     *
     * The `icons` member is optional per the spec, so dropping the four broken
     * `/icons/*.png` references keeps every shortcut working — the OS falls
     * back to the app icon — where citing missing files risked the whole
     * shortcut being discarded.
     */
    shortcuts: [
      {
        name: 'Browse Products',
        short_name: 'Products',
        description: 'View all products',
        url: APP_ROUTES.PRODUCTS,
      },
      {
        name: 'My Cart',
        short_name: 'Cart',
        description: 'View shopping cart',
        url: APP_ROUTES.CART,
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View order history',
        url: APP_ROUTES.ORDERS,
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View dashboard',
        url: APP_ROUTES.DASHBOARD,
      },
    ],

    // No related native apps
    related_applications: [],
    prefer_related_applications: false,
  };
}
