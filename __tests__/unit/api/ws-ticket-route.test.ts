/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

jest.mock('@/auth', () => ({
  AuthErrorCode: { INTERNAL_SERVER_ERROR: 'AuthInternalServerError' },
}));

const getServerAccessTokenMock = jest.fn();
jest.mock('@/core/auth/server-session', () => ({
  getServerAccessToken: () => getServerAccessTokenMock(),
}));

const serverBackendFetchMock = jest.fn();
jest.mock('@/core/client/server-fetch', () => ({
  serverBackendFetch: (...args: unknown[]) => serverBackendFetchMock(...args),
}));

const limitMock = jest.fn();
jest.mock('@/shared/utils/rate-limit', () => ({
  limit: (...args: unknown[]) => limitMock(...args),
}));

const logMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('@/core/telemetry/logger', () => ({
  getRequestLogger: jest.fn(() => logMock),
}));

import { GET } from '@/app/api/ws-ticket/route';

function makeRequest(): NextRequest {
  return new NextRequest(new Request('http://localhost:3000/api/ws-ticket'));
}

describe('GET /api/ws-ticket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    limitMock.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
  });

  it('returns 401 when there is no server-side access token', async () => {
    getServerAccessTokenMock.mockResolvedValue(undefined);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.errorCode).toBe('NotAuthenticated');
    expect(serverBackendFetchMock).not.toHaveBeenCalled();
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    getServerAccessTokenMock.mockResolvedValue('real-access-token');
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.errorCode).toBe('RateLimitExceeded');
    expect(serverBackendFetchMock).not.toHaveBeenCalled();
  });

  it('calls the backend with the real access token and returns only the ticket', async () => {
    getServerAccessTokenMock.mockResolvedValue('real-access-token-value');
    serverBackendFetchMock.mockResolvedValue({
      data: { ticket: 'opaque-ticket-value', expiresInSeconds: 45 },
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(serverBackendFetchMock).toHaveBeenCalledWith('/api/v1/ws/ticket', 'real-access-token-value', {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    expect(body).toEqual({ ticket: 'opaque-ticket-value', expiresInSeconds: 45 });
    // The real access token must never appear in the response body.
    expect(JSON.stringify(body)).not.toContain('real-access-token-value');
  });

  it('maps a backend error status through rather than always returning 500', async () => {
    getServerAccessTokenMock.mockResolvedValue('real-access-token');
    serverBackendFetchMock.mockRejectedValue({ status: 401, message: 'backend rejected token' });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.errorCode).toBe('WsTicketRequestFailed');
  });

  it('returns a sanitized 500 in production when an unexpected error occurs', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
    jest.resetModules();

    jest.doMock('@/auth', () => ({
      AuthErrorCode: { INTERNAL_SERVER_ERROR: 'AuthInternalServerError' },
    }));
    jest.doMock('@/core/auth/server-session', () => ({
      getServerAccessToken: jest.fn().mockRejectedValue(new Error('boom: internal detail')),
    }));
    jest.doMock('@/core/client/server-fetch', () => ({ serverBackendFetch: serverBackendFetchMock }));
    jest.doMock('@/shared/utils/rate-limit', () => ({ limit: limitMock }));
    jest.doMock('@/core/telemetry/logger', () => ({ getRequestLogger: jest.fn(() => logMock) }));

    try {
      const { GET: prodGet } = await import('@/app/api/ws-ticket/route');
      const res = await prodGet(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.message).not.toContain('boom');
    } finally {
      (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv;
      jest.resetModules();
    }
  });
});
