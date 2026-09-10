import { API_ENDPOINTS } from '@/shared/constants/api/endpoints';

describe('API Endpoints Constants', () => {
  it('adds version prefixes dynamically to standard routes', () => {
    // Standard routes should start with '/api/{version}/'
    expect(API_ENDPOINTS.AUTH.LOGIN).toMatch(/^\/api\/[a-z0-9]+\/auth\/login$/);
    expect(API_ENDPOINTS.PRODUCTS.LIST).toMatch(/^\/api\/[a-z0-9]+\/products$/);
    expect(API_ENDPOINTS.USERS.PROFILE).toMatch(/^\/api\/[a-z0-9]+\/users\/me$/);
  });

  it('bypasses version prefix logic for webhook routes', () => {
    // Webhook routes should be raw and unversioned
    expect(API_ENDPOINTS.PAYMENTS.WEBHOOK_STRIPE).toBe('/api/webhooks/stripe');
  });

  it('bypasses version prefix logic for server-sent event streams', () => {
    // SSE stream route should be raw and unversioned
    const orderId = '123';
    expect(API_ENDPOINTS.ORDERS.STREAM(orderId)).toBe(`/api/orders/${orderId}/stream`);
  });

  it('enforces safety validation on dynamic path functions', () => {
    // Invalid ID should throw error
    expect(() => API_ENDPOINTS.PRODUCTS.UPDATE('invalid/id')).toThrow();
    // Invalid slug should throw error
    expect(() => API_ENDPOINTS.PRODUCTS.DETAIL('invalid_slug_!')).toThrow();
    // Invalid handle should throw error
    expect(() => API_ENDPOINTS.SELLER.CHECK_HANDLE('a')).toThrow();
  });
});
