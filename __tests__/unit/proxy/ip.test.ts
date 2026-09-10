/**
 * @jest-environment node
 *
 * Regression test for the finding in the proxy review: getTrustedIp()
 * previously trusted the FIRST entry of X-Forwarded-For, which — in the
 * confirmed production topology (nginx, which appends the real client IP
 * rather than overwriting the header) — is exactly the value a client can
 * set themselves, defeating rate limiting. It must trust the LAST entry.
 */
import { NextRequest } from 'next/server';
import { getTrustedIp } from '@/proxy/utils/ip';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new Request('http://localhost:3000/api/v1/products', { headers }));
}

describe('getTrustedIp', () => {
  it('trusts the LAST entry of a multi-hop X-Forwarded-For chain, not the first', () => {
    // Simulates a client spoofing the header before nginx appends the real IP.
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.99, 198.51.100.7' });
    expect(getTrustedIp(req)).toBe('198.51.100.7');
  });

  it('trims whitespace around the trusted entry', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.99 ,   198.51.100.7  ' });
    expect(getTrustedIp(req)).toBe('198.51.100.7');
  });

  it('handles a single-value X-Forwarded-For header', () => {
    const req = makeRequest({ 'x-forwarded-for': '198.51.100.7' });
    expect(getTrustedIp(req)).toBe('198.51.100.7');
  });

  it('falls back to x-real-ip when X-Forwarded-For is absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.7' });
    expect(getTrustedIp(req)).toBe('198.51.100.7');
  });

  it('prefers X-Forwarded-For over x-real-ip when both are present', () => {
    const req = makeRequest({
      'x-forwarded-for': '198.51.100.7',
      'x-real-ip': '203.0.113.99',
    });
    expect(getTrustedIp(req)).toBe('198.51.100.7');
  });

  it('falls back to 127.0.0.1 when no proxy headers are present in a test/dev environment', () => {
    // __tests__/setup.ts's global @/env mock reports NODE_ENV: 'test', so
    // this branch is exercised regardless of the request's host header.
    const req = makeRequest({ host: 'example.com' });
    expect(getTrustedIp(req)).toBe('127.0.0.1');
  });

  it('returns "unknown" in production with no proxy headers and a non-local host', () => {
    jest.resetModules();
    jest.doMock('@/env', () => ({ env: { NODE_ENV: 'production' } }));

    let getTrustedIpProd: typeof getTrustedIp;
    let NextRequestProd: typeof NextRequest;
    jest.isolateModules(() => {
      NextRequestProd = require('next/server').NextRequest;
      getTrustedIpProd = require('@/proxy/utils/ip').getTrustedIp;
    });

    const req = new NextRequestProd!(
      new Request('http://example.com/api/v1/products', { headers: { host: 'example.com' } })
    );
    expect(getTrustedIpProd!(req)).toBe('unknown');

    jest.dontMock('@/env');
    jest.resetModules();
  });
});
