/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// @/auth (→ lib/auth/index.ts) imports the real next-auth package, which
// ships ESM next-auth/@auth-core cannot be parsed by Jest's default
// CommonJS transform. Every test below passes its own stub handler map
// explicitly, so the real handlers re-exported here are never actually
// invoked — this mock exists purely to keep that package out of the
// module graph during the test run.
jest.mock('@/auth', () => ({
  handlers: { GET: jest.fn(), POST: jest.fn() },
  AuthErrorCode: { INTERNAL_SERVER_ERROR: 'AuthInternalServerError' },
}));

import { handleAuth } from '@/app/api/auth/[...nextauth]/route';

// The route module reads process.env.NODE_ENV at import time (`isProd`) —
// mock it before import via jest's module registry reset per test.
const originalNodeEnv = process.env.NODE_ENV;

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new Request(`http://localhost:3000${pathname}`));
}

describe('NextAuth route handler catch/format logic', () => {
  afterEach(() => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = originalNodeEnv;
    jest.resetModules();
  });

  it('passes through the real handler result when nothing throws', async () => {
    const okResponse = new Response('ok', { status: 200 });
    const stubHandlers = {
      GET: jest.fn().mockResolvedValue(okResponse),
      POST: jest.fn().mockResolvedValue(okResponse),
    };

    const handler = handleAuth('GET', stubHandlers);
    const res = await handler(makeRequest('/api/auth/session'), undefined);

    expect(res).toBe(okResponse);
    expect(stubHandlers.GET).toHaveBeenCalledTimes(1);
  });

  it('redirects browser-navigation routes (callback) to /login on an unexpected throw', async () => {
    const stubHandlers = {
      GET: jest.fn().mockRejectedValue(new Error('boom: internal db connection string leaked')),
      POST: jest.fn(),
    };

    const handler = handleAuth('GET', stubHandlers);
    const res = await handler(makeRequest('/api/auth/callback/keycloak'), undefined);

    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('error=AuthInternalServerError');
    expect(location).toContain('requestId=');
    // The raw exception text must never leak into a URL a user could screenshot/share.
    expect(location).not.toContain('boom');
  });

  it('returns JSON (not a redirect) for /signout on an unexpected throw', async () => {
    // Regression test: next-auth/react's client-side signOut() POSTs to
    // /signout via fetch() and calls res.json() on the response. A 302
    // redirect here would make that .json() call throw a SyntaxError on
    // the redirected HTML page, surfacing as an unhandled rejection from
    // signOut() instead of a clean, JSON-parseable error — confirmed by
    // reading node_modules/next-auth/react.js directly.
    const stubHandlers = {
      GET: jest.fn(),
      POST: jest.fn().mockRejectedValue(new Error('boom: internal db connection string leaked')),
    };

    const handler = handleAuth('POST', stubHandlers);
    const res = await handler(makeRequest('/api/auth/signout'), undefined);

    expect(res.status).toBe(500);
    expect(res.headers.get('location')).toBeNull();
    const body = await res.json();
    expect(body.errorCode).toBe('AuthInternalServerError');
  });

  it('returns JSON (not a redirect) for /signin/:provider on an unexpected throw', async () => {
    // Same regression as /signout: next-auth/react's signIn() also POSTs
    // via fetch() and expects JSON back, despite the "/signin/" path name
    // implying a raw browser navigation.
    const stubHandlers = {
      GET: jest.fn(),
      POST: jest.fn().mockRejectedValue(new Error('boom: internal db connection string leaked')),
    };

    const handler = handleAuth('POST', stubHandlers);
    const res = await handler(makeRequest('/api/auth/signin/keycloak'), undefined);

    expect(res.status).toBe(500);
    expect(res.headers.get('location')).toBeNull();
    const body = await res.json();
    expect(body.errorCode).toBe('AuthInternalServerError');
  });

  it('still redirects /callback/:provider (a genuine GET browser navigation) to /login', async () => {
    const stubHandlers = {
      GET: jest.fn().mockRejectedValue(new Error('boom')),
      POST: jest.fn(),
    };

    const handler = handleAuth('GET', stubHandlers);
    const res = await handler(makeRequest('/api/auth/callback/keycloak'), undefined);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('returns JSON with a requestId for non-navigation routes (e.g. /session)', async () => {
    const stubHandlers = {
      GET: jest.fn().mockRejectedValue(new Error('boom: internal db connection string leaked')),
      POST: jest.fn(),
    };

    const handler = handleAuth('GET', stubHandlers);
    const res = await handler(makeRequest('/api/auth/session'), undefined);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.errorCode).toBe('AuthInternalServerError');
    expect(typeof body.requestId).toBe('string');
    expect(body.requestId.length).toBeGreaterThan(0);
  });

  it('sanitizes the raw error message out of the JSON response in production', async () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
    jest.resetModules();
    const { handleAuth: prodHandleAuth } = await import('@/app/api/auth/[...nextauth]/route');

    const stubHandlers = {
      GET: jest.fn().mockRejectedValue(new Error('boom: internal db connection string leaked')),
      POST: jest.fn(),
    };

    const handler = prodHandleAuth('GET', stubHandlers);
    const res = await handler(makeRequest('/api/auth/session'), undefined);
    const body = await res.json();

    expect(body.message).not.toContain('boom');
    expect(body.message).toMatch(/unexpected authentication error/i);
  });

  it('includes the raw error message in the JSON response outside production', async () => {
    const stubHandlers = {
      GET: jest.fn().mockRejectedValue(new Error('boom: internal db connection string leaked')),
      POST: jest.fn(),
    };

    const handler = handleAuth('GET', stubHandlers);
    const res = await handler(makeRequest('/api/auth/session'), undefined);
    const body = await res.json();

    expect(body.message).toContain('boom');
  });
});
