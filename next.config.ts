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
// 3. MAIN CONFIG
// ============================================================
//
// NOTE — security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy, etc.)
// are intentionally NOT set here. They previously duplicated — and disagreed
// with — the per-request nonce-based CSP that proxy.ts + shared/config/
// security-headers.ts already apply to every document/API route. Two
// independently-authored CSPs on the same response is a real bypass risk
// (the static version here always allowed 'unsafe-inline'/'unsafe-eval').
// proxy.ts's matcher covers everything except pure static assets, which don't
// need CSP anyway, so it is the single source of truth for these headers.

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
      // No dedicated /customer/dashboard page exists — /dashboard is the
      // real role-based redirect hub (app/(customer)/dashboard/page.tsx)
      // and is what customers should land on.
      { source: '/customer', destination: '/dashboard', permanent: false },
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

  /**
   * No global Cache-Control rules — deliberately. Please do not re-add them.
   *
   * Headers declared here are applied by the routing layer and **override**
   * whatever a route handler sets for the same key. That was verified against a
   * running server: `/api/debug/env` sets
   * `no-store, no-cache, must-revalidate, proxy-revalidate`, yet the response
   * carried the shorter value this file used to declare. Two rules previously
   * lived here, and both were harmful:
   *
   * 1. `/_next/static/:path*` → `public, max-age=31536000, immutable`
   *
   *    Redundant in production: Next.js already serves exactly this for
   *    `/_next/static/*`, which is safe precisely because those filenames are
   *    content-hashed. Actively harmful in development, where Next deliberately
   *    does NOT send immutable caching — dev chunk names are not stable, so a
   *    year-long immutable directive makes the browser serve stale chunks from
   *    disk cache and ignore rebuilds. It was caching the Turbopack HMR client
   *    itself. Next 16.3 added a startup warning for exactly this
   *    ("Setting a custom Cache-Control header can break Next.js development
   *    behavior"), which is what surfaced it.
   *
   * 2. `/api/:path*` → `no-store, no-cache, must-revalidate`
   *
   *    A blanket private-cache directive across a heterogeneous API surface.
   *    It silently defeated the CDN caching that `/api/search`
   *    (`s-maxage=60`) and `/api/search/suggest` (`s-maxage=300`) explicitly
   *    ask for, so neither had ever actually been cacheable at the edge.
   *
   * Cache policy belongs with the response, since only the handler knows
   * whether its payload is public or per-user. `shared/api/response.ts` applies
   * `no-store` to every route by default and lets a route opt into caching
   * explicitly; routes outside that toolkit set their own. That keeps one
   * source of truth and makes the secure default impossible to silently lose.
   */

  // ── Turbopack (Next.js 16 default bundler) ────────────
  turbopack: {},

  // ── Webpack (Compatibility fallback) ────────────────────
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
