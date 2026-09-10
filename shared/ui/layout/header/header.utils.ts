import { APP_ROUTES } from '@/shared/routes';

/**
 * Returns true if the current path is a seller or delivery dashboard route
 * where consumer-facing elements (search, cart, wishlist) should be hidden.
 */
export function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return (
    pathname.startsWith(APP_ROUTES.SELLER.BASE) ||
    pathname.startsWith(APP_ROUTES.DELIVERY.DASHBOARD)
  );
}
