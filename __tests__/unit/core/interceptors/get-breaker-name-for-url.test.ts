import { getBreakerNameForUrl } from '@/core/interceptors';

describe('getBreakerNameForUrl', () => {
  it('returns "default" when no url is given', () => {
    expect(getBreakerNameForUrl(undefined)).toBe('default');
  });

  it('routes product/catalog reads to the "catalog" breaker', () => {
    expect(getBreakerNameForUrl('/api/v1/products/123')).toBe('catalog');
    expect(getBreakerNameForUrl('/api/v1/catalog/search')).toBe('catalog');
  });

  it('routes seller endpoints to the "seller" breaker', () => {
    expect(getBreakerNameForUrl('/api/v1/seller/dashboard')).toBe('seller');
  });

  it('routes auth endpoints to the "auth" breaker', () => {
    expect(getBreakerNameForUrl('/api/v1/auth/login')).toBe('auth');
  });

  it('routes orders and checkout endpoints to the "order" breaker', () => {
    expect(getBreakerNameForUrl('/api/v1/orders/456')).toBe('order');
    expect(getBreakerNameForUrl('/api/v1/checkout/session')).toBe('order');
  });

  it('falls back to "default" for unrecognized paths', () => {
    expect(getBreakerNameForUrl('/api/v1/notifications')).toBe('default');
  });

  it('checks patterns in priority order for urls matching more than one', () => {
    // '/products' is checked before '/orders' — a url containing both should
    // route to 'catalog', not 'order'.
    expect(getBreakerNameForUrl('/api/v1/products/456/orders-history')).toBe('catalog');
  });
});
