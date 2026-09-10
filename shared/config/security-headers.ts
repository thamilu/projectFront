import { env } from '@/env';
import { THEME_BOOTSTRAP_SCRIPT_HASH } from '@/shared/theme/theme-bootstrap';

const isProd = env.NODE_ENV === 'production';

export const STATIC_SECURITY_HEADERS: ReadonlyArray<[string, string]> = [
  ['X-DNS-Prefetch-Control', 'on'],
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['X-Permitted-Cross-Domain-Policies', 'none'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
  // 'same-origin' is safe here: the Keycloak flow is full-page redirect only
  // (the popup-based flow was removed — see deleted app/(auth)/auth/popup-finish).
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Cross-Origin-Resource-Policy', 'same-site'],
  [
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),
  ],
] as const;

/**
 * Builds Content Security Policy (CSP) headers with a per-request nonce.
 * Allows script execution with nonce, inline styling, image/font CDNs,
 * and environment-specific API endpoints.
 */
export function buildCsp(nonce: string): string {
  const apiUrl = env.NEXT_PUBLIC_API_URL ?? '';
  const keycloakUrl = env.NEXT_PUBLIC_KEYCLOAK_URL ?? '';
  const r2Url = env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

  // Only widen the CSP for Stripe when it's actually configured — a
  // deployment that never sets the publishable key gets no extra allowance.
  // Stripe.js (infrastructure/payments/stripe-client.ts) injects its own
  // <script src="https://js.stripe.com/v3"> tag at runtime, makes XHR/fetch
  // calls to api.stripe.com (tokenization) and m.stripe.network (Radar
  // fraud-detection telemetry), and the PaymentElement it mounts embeds
  // iframes from js.stripe.com — all three directives need the allowance,
  // not just script-src, or Elements silently fails to load/submit.
  const stripeEnabled = !!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // In CSP Level 3, 'unsafe-inline' is silently ignored when a nonce is present.
  // Next.js Turbopack injects inline scripts WITHOUT nonce attributes, so in dev
  // mode we must NOT include the nonce — otherwise hydration and HMR scripts are
  // blocked, causing a blank page. In production, the nonce + 'strict-dynamic'
  // is the correct approach (Next.js adds nonces to its own scripts).
  //
  // 'strict-dynamic' (prod) already trusts a script dynamically injected by
  // an already-nonced script regardless of its src host, which in principle
  // covers Stripe.js's runtime injection — but dev mode has no
  // 'strict-dynamic', so js.stripe.com must be listed explicitly there (and
  // harmlessly redundant in prod) for local Stripe testing to work at all.
  // The blocking theme bootstrap is allow-listed by HASH as well as by nonce.
  // A nonce only exists for request-time renders: during static generation
  // getCSPNonce() has no headers() to read and returns undefined, so the
  // prerendered HTML for /products/[slug] (which uses generateStaticParams)
  // would carry an un-nonced inline script and be blocked — reinstating the
  // dark-mode flash the script exists to prevent. Under CSP Level 3
  // 'strict-dynamic' still honours hashes, so this covers both cases.
  // See shared/theme/theme-bootstrap.ts for the invariant that keeps the hash
  // and the script in lockstep.
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' '${THEME_BOOTSTRAP_SCRIPT_HASH}' 'strict-dynamic'${stripeEnabled ? ' https://js.stripe.com' : ''}`
    : `script-src 'self' 'unsafe-eval' 'unsafe-inline'${stripeEnabled ? ' https://js.stripe.com' : ''}`;

  const connectSrc = isProd
    ? `connect-src 'self' ${apiUrl} ${keycloakUrl} ${r2Url}${stripeEnabled ? ' https://api.stripe.com https://m.stripe.network' : ''}`
    : `connect-src 'self' ${apiUrl} ${keycloakUrl} ${r2Url} http: ws: wss:${stripeEnabled ? ' https://api.stripe.com https://m.stripe.network' : ''}`;

  const frameSrc = stripeEnabled
    ? "frame-src 'self' https://js.stripe.com https://hooks.stripe.com"
    : "frame-src 'self'";

  // Product/media images can be served from the backend API origin or the R2
  // bucket (see NEXT_PUBLIC_R2_PUBLIC_URL) in addition to the fixed third-party
  // hosts below — both must be allow-listed or real product images 404 under CSP.
  const imgSrc = [
    "img-src 'self' data: blob:",
    'https://res.cloudinary.com',
    'https://lh3.googleusercontent.com',
    apiUrl,
    r2Url,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    "default-src 'self'",
    scriptSrc,
    // style-src-attr 'none' is omitted as it blocks all React/Next.js inline style attributes
    // (such as dynamic progress bar widths and custom backgrounds). CSS injection protection is
    // instead enforced by sanitizing dynamic style values using sanitizeCSSValue.
    "style-src 'self' 'unsafe-inline'",
    imgSrc,
    "font-src 'self' data: https:",
    connectSrc,
    frameSrc,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}
