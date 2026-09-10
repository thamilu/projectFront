import { logger } from '@/core/telemetry/logger';
import * as Sentry from '@sentry/nextjs';

const mockCaptureException = Sentry.captureException as jest.Mock;
const mockCaptureMessage = Sentry.captureMessage as jest.Mock;

describe('logger PII/secret redaction', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  function loggedOutput(): string {
    // safeConsoleMethod always emits via console.log regardless of level.
    const call = consoleLogSpy.mock.calls.find((args) => typeof args[0] === 'string');
    return call ? String(call[0]) : '';
  }

  // Regression: sensitiveKeys previously held mixed-case entries
  // ('panNumber', 'businessPan', 'accessToken', 'apiKey', 'idToken',
  // 'refreshToken', 'codeVerifier') while the comparison lower-cases the
  // context key before checking `.includes(...)` — a case-sensitive
  // check, so e.g. "pannumber".includes("panNumber") is always false.
  // Real PAN/Aadhaar/GSTIN numbers reached structured logs (persisted to
  // a local log file server-side, sent to /api/logs client-side)
  // completely unredacted.
  it('redacts panNumber regardless of the case mismatch bug', () => {
    logger.error('KYC verification attempted', { panNumber: 'ABCDE1234F' });

    const output = loggedOutput();
    expect(output).not.toContain('ABCDE1234F');
    expect(output).toContain('[REDACTED]');
  });

  it('redacts businessPan, aadhar, and gstin', () => {
    logger.info('Business KYC submitted', {
      businessPan: 'XYZAB5678C',
      aadhar: '123456789012',
      gstin: '22AAAAA0000A1Z5',
    });

    const output = loggedOutput();
    expect(output).not.toContain('XYZAB5678C');
    expect(output).not.toContain('123456789012');
    expect(output).not.toContain('22AAAAA0000A1Z5');
  });

  it('redacts camelCase token/secret fields', () => {
    logger.warn('Token refresh', {
      accessToken: 'super-secret-access-token-value',
      refreshToken: 'super-secret-refresh-token-value',
      apiKey: 'super-secret-api-key-value',
    });

    const output = loggedOutput();
    expect(output).not.toContain('super-secret-access-token-value');
    expect(output).not.toContain('super-secret-refresh-token-value');
    expect(output).not.toContain('super-secret-api-key-value');
  });

  it('does not redact unrelated fields', () => {
    logger.info('Non-sensitive event', { productId: 42, action: 'view' });

    const output = loggedOutput();
    expect(output).toContain('42');
    expect(output).toContain('view');
    expect(output).not.toContain('[REDACTED]');
  });
});

describe('logger.error() Sentry bridge', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('reports to Sentry via captureMessage when the context has no real Error object', () => {
    logger.error('Registration failed', { status: 500, message: 'Unknown Error' });

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'Registration failed',
      expect.objectContaining({ level: 'error' })
    );
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('reports to Sentry via captureException when the context carries a real Error, preserving its stack', () => {
    const realError = new Error('Backend unreachable');
    logger.error('API call failed', { error: realError });

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(realError, expect.any(Object));
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('never sends unredacted PII/secrets to Sentry, matching the console/log-file redaction', () => {
    logger.error('KYC verification attempted', { panNumber: 'ABCDE1234F' });

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    const [, options] = mockCaptureMessage.mock.calls[0];
    expect(JSON.stringify(options.extra)).not.toContain('ABCDE1234F');
    expect(JSON.stringify(options.extra)).toContain('[REDACTED]');
  });

  it('does not report to Sentry for debug/info/warn — only error()', () => {
    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('does not throw even if Sentry itself throws', () => {
    mockCaptureMessage.mockImplementationOnce(() => {
      throw new Error('Sentry transport down');
    });

    expect(() => logger.error('Something failed')).not.toThrow();
  });
});
