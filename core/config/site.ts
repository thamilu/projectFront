/**
 * Site Configuration
 *
 * Centralized configuration for application metadata, SEO, and branding.
 * Uses Zod for runtime validation to catch configuration errors early.
 *
 * @module lib/config/site
 */

import { siteDefaults, getEnv, getEnvUrl } from './site-defaults';
import { SiteConfig, SiteConfigSchema } from './site-schema';

function createSiteConfig(): SiteConfig {
  const appUrl = getEnvUrl('NEXT_PUBLIC_APP_URL', siteDefaults.url);

  const config: SiteConfig = {
    name: getEnv('NEXT_PUBLIC_APP_NAME', siteDefaults.name),
    description: siteDefaults.description,
    url: appUrl,
    ogImage: siteDefaults.ogImage,
    author: {
      name: getEnv('NEXT_PUBLIC_SITE_AUTHOR_NAME', siteDefaults.author.name),
      url: appUrl,
      email: getEnv('NEXT_PUBLIC_SITE_AUTHOR_EMAIL', siteDefaults.author.email),
    },
    keywords: [...siteDefaults.keywords],
    locale: getEnv('NEXT_PUBLIC_SITE_LOCALE', siteDefaults.locale),
    twitterHandle: getEnv('NEXT_PUBLIC_SITE_TWITTER', siteDefaults.twitterHandle) as any,
    links: {
      twitter: getEnv('NEXT_PUBLIC_SITE_LINK_TWITTER', siteDefaults.links.twitter),
      github: getEnv('NEXT_PUBLIC_SITE_LINK_GITHUB', siteDefaults.links.github),
      linkedin: getEnv('NEXT_PUBLIC_SITE_LINKEDIN', siteDefaults.links.linkedin),
      facebook: getEnv('NEXT_PUBLIC_SITE_LINK_FACEBOOK', siteDefaults.links.facebook),
      instagram: getEnv('NEXT_PUBLIC_SITE_LINK_INSTAGRAM', siteDefaults.links.instagram),
    },
    pagination: {
      defaultPageSize: Number(
        getEnv('NEXT_PUBLIC_DEFAULT_PAGE_SIZE', String(siteDefaults.pagination.defaultPageSize))
      ),
      maxPageSize: Number(
        getEnv('NEXT_PUBLIC_MAX_PAGE_SIZE', String(siteDefaults.pagination.maxPageSize))
      ),
      searchDebounceMs: Number(
        getEnv('NEXT_PUBLIC_SEARCH_DEBOUNCE_MS', String(siteDefaults.pagination.searchDebounceMs))
      ),
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    },
  };

  try {
    return SiteConfigSchema.parse(config);
  } catch (error) {
    console.error('❌ Invalid site configuration:', error);
    throw new Error('Site configuration validation failed. Check console for details.');
  }
}

export const siteConfig = createSiteConfig();
