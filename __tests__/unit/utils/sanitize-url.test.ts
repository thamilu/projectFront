import { sanitizeUrl, isExternalUrl } from '@/shared/utils/sanitize-url';

// Mock the logger to prevent actual telemetry calls in tests
jest.mock('@/core/telemetry/logger', () => ({
  logSecurityEvent: jest.fn(),
}));

import { logSecurityEvent } from '@/core/telemetry/logger';

describe('sanitizeUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Allowlist: URLs that should pass through unchanged ────────────────

  it('allows https:// URLs unchanged', () => {
    expect(sanitizeUrl('https://valid.com')).toBe('https://valid.com');
  });

  it('allows http:// URLs unchanged', () => {
    expect(sanitizeUrl('http://valid.com')).toBe('http://valid.com');
  });

  it('allows root-relative paths unchanged', () => {
    expect(sanitizeUrl('/internal/path')).toBe('/internal/path');
  });

  it('allows hash fragments unchanged', () => {
    expect(sanitizeUrl('#section')).toBe('#section');
  });

  // ── Blocklist: dangerous protocols ────────────────────────────────────

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  it('blocks JAVASCRIPT: protocol (case-insensitive)', () => {
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  it('blocks ftp: protocol', () => {
    expect(sanitizeUrl('ftp://files.com')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  // ── Blocklist: protocol-relative URLs ─────────────────────────────────

  it('blocks // protocol-relative URLs', () => {
    expect(sanitizeUrl('//evil.com')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  // ── Blocklist: empty and bare relative ────────────────────────────────

  it('blocks empty string', () => {
    expect(sanitizeUrl('')).toBe('#');
  });

  it('blocks bare relative paths without leading /', () => {
    expect(sanitizeUrl('register')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });

  // ── Whitespace bypass defense ─────────────────────────────────────────

  it('blocks whitespace-padded javascript: protocol (bypass defense)', () => {
    expect(sanitizeUrl('   javascript:  ')).toBe('#');
    expect(logSecurityEvent).toHaveBeenCalled();
  });
});

describe('isExternalUrl', () => {
  it('returns true for https:// URLs', () => {
    expect(isExternalUrl('https://example.com')).toBe(true);
  });

  it('returns true for http:// URLs', () => {
    expect(isExternalUrl('http://cdn.example.com')).toBe(true);
  });

  it('returns false for root-relative paths', () => {
    expect(isExternalUrl('/seller/register')).toBe(false);
  });

  it('returns false for hash fragments', () => {
    expect(isExternalUrl('#section')).toBe(false);
  });

  it('returns false for blocked fallback #', () => {
    expect(isExternalUrl('#')).toBe(false);
  });
});
