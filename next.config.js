/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

function normalizeBackendOrigin(raw) {
  const value = String(raw || '')
    .trim()
    .replace(/\/api\/v1\/?$/i, '')
    .replace(/\/+$/, '');

  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function getBackendOrigin() {
  return (
    normalizeBackendOrigin(process.env.INTERNAL_API_URL) ||
    normalizeBackendOrigin(process.env.BACKEND_API_URL) ||
    normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeBackendOrigin(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    'http://127.0.0.1:8082'
  );
}

function buildCsp() {
  // Start in Report-Only mode (safe) and tighten once the app is fully CSP-clean.
  // Keep this permissive enough for Next + third-party integrations.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    // Next dev and some libs may require inline/eval; report-only avoids breakage.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: http: ws: wss:",
  ].join('; ');
}

const nextConfig = {
  reactStrictMode: true,
  // Turbopack is default in Next 16; keep an explicit config to avoid
  // dev-time conflicts when plugins add webpack customizations.
  turbopack: {},
  experimental: {
    // serverActions: true, // Enabled by default in Next 14+
    // instrumentationHook: true, // Enabled by default in recent versions, but explicit doesn't hurt if older
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      // Allow backend-hosted media (e.g. store logos) without hardcoding.
      ...(function () {
        try {
          const origin = getBackendOrigin();
          const u = new URL(origin);
          return [
            {
              protocol: u.protocol.replace(':', ''),
              hostname: u.hostname,
              ...(u.port ? { port: u.port } : {}),
              pathname: '/**',
            },
          ];
        } catch {
          return [];
        }
      })(),
      // Allow Cloudflare R2 images dynamically from environment variable
      ...(function () {
        try {
          const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;
          if (!r2Url) return [];
          const u = new URL(r2Url);
          return [
            {
              protocol: u.protocol.replace(':', ''),
              hostname: u.hostname,
              ...(u.port ? { port: u.port } : {}),
              pathname: '/**',
            },
          ];
        } catch {
          return [];
        }
      })(),
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/customer',
        destination: '/customer/dashboard',
        permanent: true,
      },
      {
        source: '/seller',
        destination: '/seller/dashboard',
        permanent: true,
      },
    ];
  },
  // Proxy API requests to Spring Boot backend
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
  // Security headers
  async headers() {
    const csp = buildCsp();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          // Safe-by-default CSP rollout.
          ...(isProd
            ? [
                {
                  key: 'Content-Security-Policy-Report-Only',
                  value: csp,
                },
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ];
  },

  // Outputs for various deployment targets
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
};
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  customWorkerDir: 'sw',
  fallbacks: {
    document: '/offline',
  },
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// next-pwa relies on webpack config hooks. To keep `next dev --turbopack` fast and
// compatible, only enable PWA during production builds.
const configWithPwa = isProd ? withPWA(nextConfig) : nextConfig;

module.exports = withBundleAnalyzer(configWithPwa);
