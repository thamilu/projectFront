/**
 * @jest-environment node
 *
 * sign-out.ts has its own runtime server-only guard (throws if `window` is
 * defined), same as token-refresh.ts — jsdom (the default test environment)
 * defines `window` globally, which would trip that guard on import.
 */

jest.mock('@/core/telemetry/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// sign-out.ts imports asExtendedJWT from ./utils, which imports jose (pure
// ESM, unparseable by Jest's default transform) — see token-refresh.test.ts
// for the same mock and rationale.
jest.mock('jose', () => ({
  decodeJwt: jest.fn(() => ({ sub: 'user-1', realm_access: { roles: [] } })),
}));

const afterMock = jest.fn();
jest.mock('next/server', () => ({
  after: (task: unknown) => afterMock(task),
}));

import { handleKeycloakSignOut } from '@/lib/auth/sign-out';
import { logger } from '@/core/telemetry/logger';
import type { ExtendedJWT } from '@/lib/auth/types';

function makeMessage(overrides: Partial<ExtendedJWT> = {}) {
  return {
    token: {
      idToken: 'id-token-value',
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: 0,
      roles: [],
      userId: 'user-1',
      sub: 'user-1',
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      ...overrides,
    },
  };
}

describe('handleKeycloakSignOut', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('does nothing when the message has no token', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut({ session: undefined } as never);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('does nothing when the token has no idToken', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut(makeMessage({ idToken: undefined }) as never);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(afterMock).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('[Auth] Sign-out skipped — no idToken present');
  });

  it('schedules the logout via after() and calls Keycloak once on success', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut(makeMessage() as never);

    expect(afterMock).toHaveBeenCalledTimes(1);
    const scheduledTask = afterMock.mock.calls[0][0] as () => Promise<void>;
    await scheduledTask();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      '[Auth] Keycloak session successfully terminated on sign out'
    );
  });

  it('retries once on a 5xx response and succeeds on the retry', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut(makeMessage() as never);
    const scheduledTask = afterMock.mock.calls[0][0] as () => Promise<void>;
    await scheduledTask();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry on a 4xx response', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 400, statusText: 'Bad Request' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut(makeMessage() as never);
    const scheduledTask = afterMock.mock.calls[0][0] as () => Promise<void>;
    await scheduledTask();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to a detached promise when after() throws (no request scope)', async () => {
    afterMock.mockImplementationOnce(() => {
      throw new Error('`after` was called outside a request scope.');
    });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut(makeMessage() as never);

    // Give the detached (un-awaited) fallback promise a tick to run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      '[Auth] after() unavailable for back-channel logout — using detached promise',
      expect.any(Object)
    );
  });

  it('logs a sanitized error message, not a raw Error object, on network failure', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
    global.fetch = fetchMock as unknown as typeof fetch;

    await handleKeycloakSignOut(makeMessage() as never);
    const scheduledTask = afterMock.mock.calls[0][0] as () => Promise<void>;
    await scheduledTask();

    expect(logger.error).toHaveBeenCalledWith(
      '[Auth] Keycloak back-channel logout failed',
      expect.objectContaining({ error: 'ECONNRESET' })
    );
  });
});
