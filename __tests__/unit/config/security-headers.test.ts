import { buildCsp, STATIC_SECURITY_HEADERS } from '@/shared/config/security-headers';

describe('buildCsp', () => {
  const NONCE = 'test-nonce-abc123';

  it('includes the nonce and strict-dynamic in script-src for production', () => {
    // security-headers.ts reads env.NODE_ENV (the mocked @/env module from
    // __tests__/setup.ts, hardcoded to 'test'), not process.env.NODE_ENV
    // directly — so the production branch must be exercised via a
    // module-scoped override of the mock, not by mutating process.env.
    jest.resetModules();
    jest.doMock('@/env', () => ({
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://localhost:8080',
        NEXT_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
        NEXT_PUBLIC_R2_PUBLIC_URL: 'https://r2.mock.example.com',
      },
    }));

    let buildCspProd: typeof buildCsp;
    jest.isolateModules(() => {
      buildCspProd = require('@/shared/config/security-headers').buildCsp;
    });

    const csp = buildCspProd!(NONCE);
    expect(csp).toContain(`'nonce-${NONCE}'`);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toContain("'unsafe-eval'");

    jest.dontMock('@/env');
    jest.resetModules();
  });

  it('omits the nonce and allows unsafe-eval/unsafe-inline in non-production (Turbopack HMR)', () => {
    const csp = buildCsp(NONCE);
    expect(csp).not.toContain(`'nonce-${NONCE}'`);
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("'unsafe-inline'");
  });

  it('allow-lists the configured API, Keycloak, and R2 origins for img-src', () => {
    const csp = buildCsp(NONCE);
    const imgSrcLine = csp.split('; ').find((line) => line.startsWith('img-src'));
    expect(imgSrcLine).toBeDefined();
    expect(imgSrcLine).toContain('http://localhost:8080'); // mocked NEXT_PUBLIC_API_URL
    expect(imgSrcLine).toContain('https://r2.mock.example.com'); // mocked NEXT_PUBLIC_R2_PUBLIC_URL
    expect(imgSrcLine).toContain('res.cloudinary.com');
    expect(imgSrcLine).toContain('lh3.googleusercontent.com');
  });

  it('allow-lists the configured API and Keycloak origins for connect-src', () => {
    const csp = buildCsp(NONCE);
    const connectSrcLine = csp.split('; ').find((line) => line.startsWith('connect-src'));
    expect(connectSrcLine).toBeDefined();
    expect(connectSrcLine).toContain('http://localhost:8080');
  });

  it('does not widen the CSP for Stripe when no publishable key is configured', () => {
    // The global @/env mock (__tests__/setup.ts) defaults
    // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to a mock value for every other
    // test in this suite — this one explicitly unsets it to exercise the
    // not-configured branch.
    jest.resetModules();
    jest.doMock('@/env', () => ({
      env: {
        NODE_ENV: 'test',
        NEXT_PUBLIC_API_URL: 'http://localhost:8080',
        NEXT_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
        NEXT_PUBLIC_R2_PUBLIC_URL: '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
      },
    }));

    let buildCspNoStripe: typeof buildCsp;
    jest.isolateModules(() => {
      buildCspNoStripe = require('@/shared/config/security-headers').buildCsp;
    });

    const csp = buildCspNoStripe!(NONCE);
    expect(csp).not.toContain('js.stripe.com');
    expect(csp).not.toContain('api.stripe.com');
    expect(csp).toContain("frame-src 'self'");

    jest.dontMock('@/env');
    jest.resetModules();
  });

  it('allow-lists Stripe script/connect/frame origins when the publishable key is configured', () => {
    jest.resetModules();
    jest.doMock('@/env', () => ({
      env: {
        NODE_ENV: 'test',
        NEXT_PUBLIC_API_URL: 'http://localhost:8080',
        NEXT_PUBLIC_KEYCLOAK_URL: 'http://localhost:8080',
        NEXT_PUBLIC_R2_PUBLIC_URL: '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      },
    }));

    let buildCspWithStripe: typeof buildCsp;
    jest.isolateModules(() => {
      buildCspWithStripe = require('@/shared/config/security-headers').buildCsp;
    });

    const csp = buildCspWithStripe!(NONCE);
    const scriptSrcLine = csp.split('; ').find((line) => line.startsWith('script-src'));
    const connectSrcLine = csp.split('; ').find((line) => line.startsWith('connect-src'));
    const frameSrcLine = csp.split('; ').find((line) => line.startsWith('frame-src'));

    expect(scriptSrcLine).toContain('https://js.stripe.com');
    expect(connectSrcLine).toContain('https://api.stripe.com');
    expect(connectSrcLine).toContain('https://m.stripe.network');
    expect(frameSrcLine).toContain('https://js.stripe.com');
    expect(frameSrcLine).toContain('https://hooks.stripe.com');

    jest.dontMock('@/env');
    jest.resetModules();
  });

  it('always includes the core locked-down directives', () => {
    const csp = buildCsp(NONCE);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
  });
});

describe('STATIC_SECURITY_HEADERS', () => {
  const headerMap = new Map(STATIC_SECURITY_HEADERS);

  it('denies framing entirely', () => {
    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
  });

  it('enforces HSTS with preload', () => {
    expect(headerMap.get('Strict-Transport-Security')).toContain('preload');
  });

  it('locks down all sensitive browser permissions', () => {
    const permissionsPolicy = headerMap.get('Permissions-Policy') ?? '';
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
      expect(permissionsPolicy).toContain(`${feature}=()`);
    }
  });
});
