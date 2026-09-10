/**
 * @jest-environment node
 *
 * Regression test for the exact bug found in the shared/store, shared/schemas,
 * and shared/routes review: PROTECTED_ROUTE_PREFIXES previously listed
 * '/customer' (a source folder name, not a real URL — app/(customer) is a
 * route group and adds no path segment) instead of the real customer-only
 * path prefixes, so applyAuthGuard silently never redirected unauthenticated
 * visitors away from /account, /cart, /checkout, /orders, or /wishlist.
 */
import { NextRequest } from 'next/server';
import { applyAuthGuard } from '@/proxy/handlers/auth-guard';

function makeRequest(pathname: string, search = ''): NextRequest {
  return new NextRequest(new Request(`http://localhost:3000${pathname}${search}`));
}

describe('applyAuthGuard', () => {
  describe('redirects unauthenticated visitors away from every real customer-only page', () => {
    const realCustomerPaths = [
      '/account',
      '/account/profile',
      '/account/addresses',
      '/account/payment-methods',
      '/account/security',
      '/account/orders',
      '/account/reviews',
      '/cart',
      '/checkout',
      '/orders',
      '/orders/123',
      '/orders/123/track',
      '/orders/123/return',
      '/orders/123/invoice',
      '/wishlist',
      '/dashboard',
      '/settings',
      '/notifications',
      '/notifications/settings',
    ];

    it.each(realCustomerPaths)('redirects %s to login when unauthenticated', (pathname) => {
      const result = applyAuthGuard(pathname, false, makeRequest(pathname));
      expect(result).not.toBeNull();
      expect(result?.status).toBe(307);
      const location = result?.headers.get('location') ?? '';
      expect(location).toContain('/login');
      expect(location).toContain(`callbackUrl=${encodeURIComponent(pathname)}`);
    });

    it.each(realCustomerPaths)('allows %s through when authenticated', (pathname) => {
      const result = applyAuthGuard(pathname, true, makeRequest(pathname));
      expect(result).toBeNull();
    });
  });

  it('redirects unauthenticated seller and delivery paths', () => {
    expect(applyAuthGuard('/seller/dashboard', false, makeRequest('/seller/dashboard'))).not.toBeNull();
    expect(applyAuthGuard('/delivery', false, makeRequest('/delivery'))).not.toBeNull();
  });

  it('does not protect public pages', () => {
    for (const pathname of ['/', '/products', '/login', '/about', '/stores']) {
      expect(applyAuthGuard(pathname, false, makeRequest(pathname))).toBeNull();
    }
  });

  it('lets /seller/register through without auth unless the wizard flow param is present', () => {
    expect(
      applyAuthGuard('/seller/register', false, makeRequest('/seller/register'))
    ).toBeNull();

    const wizardResult = applyAuthGuard(
      '/seller/register',
      false,
      makeRequest('/seller/register', '?flow=wizard')
    );
    expect(wizardResult).not.toBeNull();
    expect(wizardResult?.headers.get('location')).toContain(
      encodeURIComponent('/seller/register?flow=wizard')
    );
  });
});
