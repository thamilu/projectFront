/**
 * Configuration Module
 *
 * Centralized configuration exports for the application.
 *
 * @module lib/config
 */

export { siteConfig } from './site';
export type { SiteConfig, PaginationConfig } from './site-schema';

export { navigationConfig } from './navigation';
export type { NavItem, NavSection } from './navigation';

export { socialConfig } from './social';

export { AUTH_CONFIG } from './auth';
