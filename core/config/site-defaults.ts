/**
 * Site Configuration Defaults
 *
 * Default values used when environment variables are not set.
 *
 * @module lib/config/site-defaults
 */

export const siteDefaults = {
  name: 'eShop',
  description:
    'Complete enterprise e-commerce platform with shopping cart, wishlist, analytics, and admin dashboard. Built with Next.js, TypeScript, and Tailwind CSS for maximum performance and scalability.',
  url: 'http://localhost:3000',
  /**
   * Fallback share-image path.
   *
   * Points at the route `app/opengraph-image.tsx` generates, not a file in
   * `public/` — the previous `/og-image.png` did not exist and 404'd. Kept
   * because the config schema requires it and third-party integrations may
   * read it, but the metadata layer no longer uses it: Next injects the
   * generated image directly.
   */
  ogImage: '/opengraph-image',
  author: {
    name: 'eShop Team',
    email: 'team@eshop.com',
  },
  keywords: [
    'ecommerce',
    'shopping',
    'online store',
    'cart',
    'wishlist',
    'products',
    'analytics',
    'admin dashboard',
    'next.js',
    'react',
    'typescript',
    'tailwind',
    'enterprise',
  ],
  locale: 'en-US',
  twitterHandle: '@eshop',
  links: {
    twitter: 'https://twitter.com/eshop',
    github: 'https://github.com/eshop',
    linkedin: 'https://linkedin.com/company/eshop',
    facebook: 'https://facebook.com/eshop',
    instagram: 'https://instagram.com/eshop',
  },
  pagination: {
    defaultPageSize: 12,
    maxPageSize: 100,
    searchDebounceMs: 300,
  },
};

export const getEnv = (key: string, fallback: string): string => {
  return process.env[key] || fallback;
};

export const getEnvUrl = (key: string, fallback: string): string => {
  const value = process.env[key];
  if (!value) return fallback;
  try {
    new URL(value);
    return value;
  } catch {
    console.warn(`Invalid URL in ${key}: ${value}. Using fallback.`);
    return fallback;
  }
};
