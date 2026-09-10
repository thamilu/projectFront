/**
 * @jest-environment node
 *
 * Coverage for applyRbac()'s real behavior. Customer-facing pages
 * (/account, /cart, /orders, /wishlist, etc.) deliberately have no RBAC
 * rule — confirmed policy: any authenticated user may use them regardless
 * of role (a seller or delivery agent can also shop as a customer).
 * Authentication itself is enforced separately by auth-guard.ts.
 */
import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { applyRbac } from '@/proxy/handlers/rbac';

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new Request(`http://localhost:3000${pathname}`));
}

function makeSession(roles: string[]): Session {
  return { roles, user: {}, expires: '2099-01-01T00:00:00.000Z' } as unknown as Session;
}

describe('applyRbac', () => {
  describe('/seller — the correctly-matching prefix', () => {
    it('redirects a non-seller away from the seller dashboard to registration', () => {
      const result = applyRbac('/seller/dashboard', makeSession(['CUSTOMER']), makeRequest('/seller/dashboard'));
      expect(result).not.toBeNull();
      expect(result?.headers.get('location')).toContain('/seller/register');
    });

    it('allows a seller through to the seller dashboard', () => {
      const result = applyRbac('/seller/dashboard', makeSession(['SELLER']), makeRequest('/seller/dashboard'));
      expect(result).toBeNull();
    });

    it('redirects an already-enrolled seller away from the registration page to the dashboard', () => {
      const result = applyRbac(
        '/seller/register',
        makeSession(['SELLER']),
        makeRequest('/seller/register')
      );
      expect(result).not.toBeNull();
      expect(result?.headers.get('location')).toContain('/seller/dashboard');
    });

    it('lets a non-seller reach the registration page itself (onboarding is not gated)', () => {
      const result = applyRbac('/seller/register', makeSession([]), makeRequest('/seller/register'));
      expect(result).toBeNull();
    });
  });

  describe('/delivery — the correctly-matching prefix', () => {
    it('redirects a non-delivery-agent away from delivery routes', () => {
      const result = applyRbac('/delivery', makeSession(['CUSTOMER']), makeRequest('/delivery'));
      expect(result).not.toBeNull();
    });

    it('allows a delivery agent through', () => {
      const result = applyRbac('/delivery', makeSession(['DELIVERY_AGENT']), makeRequest('/delivery'));
      expect(result).toBeNull();
    });
  });

  describe('customer-facing pages — no role restriction by design', () => {
    it('allows any authenticated role through to customer-facing pages (a seller can also shop)', () => {
      const realCustomerPaths = ['/account', '/cart', '/checkout', '/orders', '/wishlist'];
      for (const pathname of realCustomerPaths) {
        for (const role of ['SELLER', 'DELIVERY_AGENT', 'CUSTOMER']) {
          const result = applyRbac(pathname, makeSession([role]), makeRequest(pathname));
          expect(result).toBeNull();
        }
      }
    });
  });

  it('returns null for a path matching no configured rule', () => {
    const result = applyRbac('/products', makeSession([]), makeRequest('/products'));
    expect(result).toBeNull();
  });

  it('normalizes role casing before comparing', () => {
    const result = applyRbac('/seller/dashboard', makeSession(['seller']), makeRequest('/seller/dashboard'));
    expect(result).toBeNull();
  });
});
