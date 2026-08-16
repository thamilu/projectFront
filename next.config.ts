import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import withBundleAnalyzerInit from '@next/bundle-analyzer';

const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

// Fail-fast environment check at build time
const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
if (appEnv === 'production' || appEnv === 'staging') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || apiUrl.trim() === '') {
    throw new Error(
      '[next.config] FATAL: NEXT_PUBLIC_API_URL environment variable is required in production and staging environments.'
    );
  }
  try {
    const parsed = new URL(apiUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(
        `[next.config] FATAL: NEXT_PUBLIC_API_URL protocol must be http or https, got "${parsed.protocol}"`
      );
    }
  } catch (err) {
    throw new Error(
      `[next.config] FATAL: NEXT_PUBLIC_API_URL is not a valid absolute URL: "${apiUrl}". Error: ${(err as Error).message}`
    );
  }
}

type ImageConfig = NonNullable<NextConfig['images']>;
type RemotePattern = NonNullable<ImageConfig['remotePatterns']>[number];

// ============================================================
// 1. BACKEND ORIGIN — Server-side only resolution
// ============================================================

function normalizeOrigin(raw: string | undefined): string {
  const value = String(raw ?? '')
    .trim()
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/+$/, '');

  if (!value) return '';

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`Unsupported protocol: ${url.protocol}`);
    }
    return url.origin;
  } catch (err) {
    console.error('[next.config] Invalid URL:', raw, err);
    return '';
  }
}

function getBackendOrigin(): string {
  // NEVER use NEXT_PUBLIC_ vars here — they're public/client-side
  const resolved =
    normalizeOrigin(process.env.INTERNAL_API_URL) || normalizeOrigin(process.env.BACKEND_API_URL);

  if (!resolved) {
    if (isProd) {
      throw new Error(
        '[next.config] FATAL: Set INTERNAL_API_URL or BACKEND_API_URL for production.\n' +
          'These are server-side only — never use NEXT_PUBLIC_ vars for backend proxy.'
      );
    }
    console.warn('[next.config] No backend URL found — using dev default: http://127.0.0.1:8082');
    return 'http://127.0.0.1:8082';
  }

  return resolved;
}

// ============================================================
// 2. IMAGE REMOTE PATTERNS
// ============================================================

function urlToRemotePattern(urlString: string | undefined): RemotePattern | null {
  if (!urlString?.trim()) return null;
  try {
    const url = new URL(urlString);
    return {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**',
    };
  } catch {
    console.error('[next.config] Invalid remote pattern URL:', urlString);
    return null;
  }
}

function buildRemotePatterns(): RemotePattern[] {
  const backendOrigin = (() => {
    try {
      return getBackendOrigin();
    } catch {
      return '';
    }
  })();

  const dynamic: RemotePattern[] = [
    urlToRemotePattern(backendOrigin),
    urlToRemotePattern(process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL),
  ].filter((p): p is RemotePattern => p !== null);

  const thirdParty: RemotePattern[] = [
    { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
  ];

  const devOnly: RemotePattern[] = isDev
    ? [{ protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' }]
    : [];

  return [...dynamic, ...thirdParty, ...devOnly];
}

// ============================================================
// 3. SECURITY HEADERS
// ============================================================

function buildSecurityHeaders(): { key: string; value: string }[] {
  // ── Auth Provider Origins ────────────────────────────────────────────────────
  // Both the server-side KEYCLOAK_ISSUER (no /realms path) and
  // the public-facing URL must be permitted so the OAuth redirect
  // POST and connect-src network calls succeed.
  const keycloakBase =
    process.env.KEYCLOAK_BASE_URL ||
    (process.env.KEYCLOAK_ISSUER ? new URL(process.env.KEYCLOAK_ISSUER).origin : '') ||
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
    'http://localhost:8080';

  const baseHeaders = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    },
    // COOP: 'unsafe-none' in dev allows the Keycloak OAuth redirect flow to
    // complete across origins. In production tighten to 'same-origin-allow-popups'
    // if you use OAuth popups, or 'same-origin' if redirect-only.
    {
      key: 'Cross-Origin-Opener-Policy',
      value: isProd ? 'same-origin-allow-popups' : 'unsafe-none',
    },
    { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
    {
      key: 'Content-Security-Policy',
      value: `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https: http:;
        font-src 'self' data: https:;
        connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || ''} ${keycloakBase} ws: wss: http: https:;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self' ${keycloakBase};
      `
        .replace(/\s{2,}/g, ' ')
        .trim(),
    },
  ];

  const productionOnlyHeaders = [
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
  ];

  return isProd ? [...baseHeaders, ...productionOnlyHeaders] : baseHeaders;
}

// ============================================================
// 4. MAIN CONFIG
// ============================================================

const nextConfig: NextConfig = {
  // ── Core ────────────────────────────────────────────────
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By: Next.js
  compress: true,

  // ── TypeScript ──────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false, // Never ignore type errors in production builds
  },

  // ── Compiler ────────────────────────────────────────────
  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  // ── Output ──────────────────────────────────────────────
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // ── Images ──────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    qualities: [75, 90],
    remotePatterns: buildRemotePatterns(),
  },

  // ── Logging ─────────────────────────────────────────────
  logging: {
    fetches: { fullUrl: isDev },
  },

  // ── Routing ─────────────────────────────────────────────
  async redirects() {
    return [
      { source: '/admin', destination: '/admin/dashboard', permanent: false },
      { source: '/customer', destination: '/customer/dashboard', permanent: false },
      { source: '/seller', destination: '/seller/dashboard', permanent: false },
      // Public marketing CTAs (see OnboardingLandingCTA) link to /register; the actual
      // Keycloak registration hand-off lives at /auth/register (see AUTH_ROUTE_PREFIXES
      // in core/providers/NextAuthProvider.tsx). A config-level redirect forwards the
      // query string automatically, returns a real 307, and ships zero JS — replaces the
      // previous client-side router.replace() shim page that did the same thing worse.
      { source: '/register', destination: '/auth/register', permanent: false },
    ];
  },

  async rewrites() {
    const backendOrigin = getBackendOrigin();
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${backendOrigin}/api/v1/:path*`,
        },
      ],
    };
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: buildSecurityHeaders(),
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Never cache API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // ── Webpack ─────────────────────────────────────────────
  webpack(config, { dev, isServer }) {
    // SVG as React components
    config.module?.rules?.push({
      test: /\.svg$/i,
      use: [{ loader: '@svgr/webpack', options: { typescript: true } }],
    });

    // Don't bundle Leaflet server-side
    if (isServer) {
      if (Array.isArray(config.externals)) {
        config.externals.push({ leaflet: 'commonjs leaflet' });
      } else {
        config.externals = [{ leaflet: 'commonjs leaflet' }];
      }
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };
    }

    return config;
  },
};

// ============================================================
// 5. PLUGIN COMPOSITION
// ============================================================

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  customWorkerSrc: 'sw',
  disable: !isProd,
  fallbacks: {
    document: '/offline',
  },
});

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
});

// Composition: analyzer(pwa(nextConfig))
export default withBundleAnalyzer(withPWA(nextConfig));
