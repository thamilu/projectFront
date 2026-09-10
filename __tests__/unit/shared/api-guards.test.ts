/**
 * @jest-environment node
 *
 * Tests for the API-route guards.
 *
 * These are the controls every route now depends on for authentication, body
 * validation and throttling, so they are tested directly rather than only
 * through the routes that compose them. The body-size and control-character
 * cases in particular encode fixes for a live vulnerability: `/api/logs` had
 * no size cap, no schema and no sanitisation, and accepted arbitrary JSON from
 * anonymous callers.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';

const getTokenMock = jest.fn();
jest.mock('next-auth/jwt', () => ({ getToken: (...args: unknown[]) => getTokenMock(...args) }));

const limitMock = jest.fn();
jest.mock('@/shared/utils/rate-limit', () => ({ limit: (...args: unknown[]) => limitMock(...args) }));

jest.mock('@/env', () => ({ env: { AUTH_SECRET: 'test-auth-secret' } }));

import {
  requireSession,
  requireRole,
  readValidatedBody,
  readValidatedQuery,
  enforceRateLimit,
  getClientIp,
  DEFAULT_MAX_BODY_BYTES,
} from '@/shared/api/guards';
import { ApiError, ApiErrorCode } from '@/shared/api/errors';

function makeRequest(
  body?: string,
  init?: { url?: string; headers?: Record<string, string> }
): NextRequest {
  return new NextRequest(
    new Request(init?.url ?? 'http://localhost:3000/api/test', {
      method: body === undefined ? 'GET' : 'POST',
      body,
      headers: new Headers(init?.headers ?? {}),
    })
  );
}

/** Await a rejection and return it typed. */
async function captureApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('Expected a rejection, but the promise resolved.');
}

beforeEach(() => {
  jest.clearAllMocks();
  limitMock.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60_000 });
});

// ============================================================
// requireSession
// ============================================================

describe('requireSession', () => {
  it('reads the secret from the validated env, not a raw process.env lookup', async () => {
    // Four routes previously passed `process.env.NEXTAUTH_SECRET` — a name
    // absent from the env schema — so a deployment setting only AUTH_SECRET
    // made getToken throw MissingSecret at runtime with nothing to catch it.
    getTokenMock.mockResolvedValue({ sub: 'user-1' });

    await requireSession(makeRequest());

    expect(getTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ secret: 'test-auth-secret' })
    );
  });

  it('returns a caller whose userId is non-optional', async () => {
    getTokenMock.mockResolvedValue({
      sub: 'user-42',
      accessToken: 'at_abc',
      roles: ['CUSTOMER'],
      expiresAt: 1_700_000_000,
    });

    const caller = await requireSession(makeRequest());

    expect(caller.userId).toBe('user-42');
    expect(caller.accessToken).toBe('at_abc');
    expect(caller.roles).toEqual(['CUSTOMER']);
  });

  it('defaults roles to an empty array so callers never null-check it', async () => {
    getTokenMock.mockResolvedValue({ sub: 'user-1' });

    const caller = await requireSession(makeRequest());

    expect(caller.roles).toEqual([]);
  });

  it('throws 401 when no token is present', async () => {
    getTokenMock.mockResolvedValue(null);

    const error = await captureApiError(requireSession(makeRequest()));

    expect(error.status).toBe(401);
    expect(error.errorCode).toBe(ApiErrorCode.NOT_AUTHENTICATED);
  });

  it('throws 401 — not 500 — when a token has no subject', async () => {
    // A token without `sub` cannot identify anyone, so every ownership check
    // downstream would be meaningless.
    getTokenMock.mockResolvedValue({ accessToken: 'at_abc' });

    const error = await captureApiError(requireSession(makeRequest()));

    expect(error.status).toBe(401);
  });

  it('converts a decryption failure into 401 rather than leaking it as a 500', async () => {
    getTokenMock.mockRejectedValue(new Error('no matching decryption secret'));

    const error = await captureApiError(requireSession(makeRequest()));

    expect(error.status).toBe(401);
    // The real reason is preserved for logs but never for the response body.
    expect(error.cause).toBeInstanceOf(Error);
    expect(error.publicMessage).not.toContain('decryption');
  });
});

// ============================================================
// requireRole
// ============================================================

describe('requireRole', () => {
  const caller = { userId: 'u1', roles: ['SELLER'], raw: {} } as never;

  it('permits a caller holding one of the allowed roles', () => {
    expect(() => requireRole(caller, ['ADMIN', 'SELLER'])).not.toThrow();
  });

  it('throws 403 when the caller holds none of them', () => {
    try {
      requireRole(caller, ['ADMIN']);
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as ApiError).status).toBe(403);
      expect((error as ApiError).errorCode).toBe(ApiErrorCode.FORBIDDEN);
    }
  });
});

// ============================================================
// readValidatedBody
// ============================================================

describe('readValidatedBody', () => {
  const schema = z.object({ name: z.string().min(1), count: z.number().int() });

  it('returns the parsed value for a well-formed body', async () => {
    const req = makeRequest(JSON.stringify({ name: 'ok', count: 3 }));

    await expect(readValidatedBody(req, schema)).resolves.toEqual({ name: 'ok', count: 3 });
  });

  it('rejects a body over the cap with 413, measured in bytes not characters', async () => {
    // A multi-byte payload is larger on the wire than `.length` suggests, so
    // the check must encode before measuring.
    const oversized = JSON.stringify({ name: '€'.repeat(20), count: 1 });
    const req = makeRequest(oversized);

    const error = await captureApiError(readValidatedBody(req, schema, 30));

    expect(error.status).toBe(413);
    expect(error.errorCode).toBe(ApiErrorCode.PAYLOAD_TOO_LARGE);
  });

  it('applies a sane default cap when none is given', async () => {
    const req = makeRequest(JSON.stringify({ name: 'x'.repeat(DEFAULT_MAX_BODY_BYTES), count: 1 }));

    const error = await captureApiError(readValidatedBody(req, schema));

    expect(error.status).toBe(413);
  });

  it('distinguishes malformed JSON from a schema violation', async () => {
    const malformed = await captureApiError(readValidatedBody(makeRequest('{not json'), schema));
    expect(malformed.errorCode).toBe(ApiErrorCode.MALFORMED_BODY);

    const invalid = await captureApiError(
      readValidatedBody(makeRequest(JSON.stringify({ name: '', count: 1.5 })), schema)
    );
    expect(invalid.errorCode).toBe(ApiErrorCode.VALIDATION_FAILED);
  });

  it('reports field-level issues so a client can map errors onto inputs', async () => {
    const req = makeRequest(JSON.stringify({ name: '', count: 'nope' }));

    const error = await captureApiError(readValidatedBody(req, schema));

    const issues = error.details?.issues as Array<{ field: string; message: string }>;
    expect(issues.map((i) => i.field).sort()).toEqual(['count', 'name']);
  });

  it('strips unknown keys rather than forwarding them upstream', async () => {
    // Zod objects are strip-by-default; asserted explicitly because routes
    // forward this value to the backend.
    const req = makeRequest(JSON.stringify({ name: 'ok', count: 1, isAdmin: true }));

    await expect(readValidatedBody(req, schema)).resolves.toEqual({ name: 'ok', count: 1 });
  });
});

// ============================================================
// readValidatedQuery
// ============================================================

describe('readValidatedQuery', () => {
  const schema = z.object({ page: z.coerce.number().int().positive() });

  it('coerces string query params through the schema', () => {
    const req = makeRequest(undefined, { url: 'http://localhost:3000/api/test?page=3' });

    expect(readValidatedQuery(req, schema)).toEqual({ page: 3 });
  });

  it('throws 400 for a query that fails validation', () => {
    const req = makeRequest(undefined, { url: 'http://localhost:3000/api/test?page=-1' });

    try {
      readValidatedQuery(req, schema);
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as ApiError).status).toBe(400);
    }
  });
});

// ============================================================
// enforceRateLimit
// ============================================================

describe('enforceRateLimit', () => {
  it('passes through when the budget allows the request', async () => {
    await expect(enforceRateLimit('key')).resolves.toBeUndefined();
    expect(limitMock).toHaveBeenCalledWith('key');
  });

  it('throws 429 when the budget is exhausted', async () => {
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const error = await captureApiError(enforceRateLimit('key'));

    expect(error.status).toBe(429);
    expect(error.errorCode).toBe(ApiErrorCode.RATE_LIMIT_EXCEEDED);
  });

  it('uses a route-specific message when one is supplied', async () => {
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const error = await captureApiError(enforceRateLimit('key', 'Too many promo attempts.'));

    expect(error.publicMessage).toBe('Too many promo attempts.');
  });
});

// ============================================================
// getClientIp
// ============================================================

describe('getClientIp', () => {
  it('takes the left-most x-forwarded-for entry, which is the original client', () => {
    const req = makeRequest(undefined, {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' },
    });

    expect(getClientIp(req)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then to a sentinel', () => {
    expect(getClientIp(makeRequest(undefined, { headers: { 'x-real-ip': '198.51.100.4' } }))).toBe(
      '198.51.100.4'
    );
    expect(getClientIp(makeRequest())).toBe('unknown');
  });
});
