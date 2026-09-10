import { apiClient } from '@/core/client/axios';

describe('HTTP Client Retry Policy', () => {
  let originalAdapter: any;

  beforeAll(() => {
    originalAdapter = apiClient.defaults.adapter;
  });

  afterAll(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('retries idempotent GET requests on network or 503 failures', async () => {
    let callCount = 0;
    const mockAdapter = jest.fn().mockImplementation((config) => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject({
          config,
          response: { status: 503, headers: {} },
        });
      }
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { success: true },
      });
    });

    apiClient.defaults.adapter = mockAdapter;

    const res = await apiClient.get('/api/v1/products');
    expect(res.data).toEqual({ success: true });
    expect(callCount).toBe(3);
  });

  it('does NOT retry non-idempotent POST requests on failures', async () => {
    let callCount = 0;
    const mockAdapter = jest.fn().mockImplementation((config) => {
      callCount++;
      return Promise.reject({
        config,
        response: { status: 503, headers: {} },
      });
    });

    apiClient.defaults.adapter = mockAdapter;

    await expect(apiClient.post('/api/v1/products', { name: 'Test' })).rejects.toBeDefined();
    expect(callCount).toBe(1);
  });

  it('respects Retry-After header for 429 rate limits', async () => {
    let callCount = 0;
    const mockAdapter = jest.fn().mockImplementation((config) => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject({
          config,
          response: {
            status: 429,
            headers: { 'retry-after': '1' },
          },
        });
      }
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { rateLimitedDone: true },
      });
    });

    apiClient.defaults.adapter = mockAdapter;

    const startTime = Date.now();
    const res = await apiClient.get('/api/v1/products');
    const endTime = Date.now();

    expect(res.data).toEqual({ rateLimitedDone: true });
    expect(callCount).toBe(2);
    expect(endTime - startTime).toBeGreaterThanOrEqual(950);
  });
});
