/**
 * Header Components — Type definitions
 *
 * This file is type-only and contains NO runtime values.
 * All constants go to header.constants.ts
 *
 * @module shared/ui/layout/header/types
 */

export interface NavItem {
  href: string;
  label: string;
}

export type DialogTarget = 'cart' | 'wishlist';

export interface HeaderProps {
  /**
   * Navigation items to render.
   * Defaults to DEFAULT_NAV_ITEMS if not provided.
   *
   * ⚠️ Must be a stable reference (module constant or useMemo) to preserve React.memo optimization.
   */
  navItems?: ReadonlyArray<NavItem>;
}
