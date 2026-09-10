/**
 * Root Layout
 *
 * Enterprise-grade root layout with:
 * - Proper metadata configuration (Next.js 14+ standards)
 * - Performance-optimized font loading (with preconnect)
 * - Accessibility features (main landmark, skip-to-content, screen reader alerts)
 * - Security headers and CSP preparation
 * - SEO optimization (Open Graph, Twitter Cards, structured data)
 * - PWA support with manifest
 * - Theme support with no flash
 * - localized error boundaries
 *
 * @module app/layout
 */

import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { env } from '@/env';
import { getCSPNonce } from '@/core/security/csp';
import { fontClassNames, validateFonts } from '@/shared/fonts';
import { siteConfig } from '@/core/config/site';
import { Providers } from './providers';
import { SkipToContent } from '@/shared/ui/layout/skip-to-content';
import { AppErrorBoundary } from '@/shared/ui/error-boundary';
import { HeaderSkeleton } from '@/shared/ui/layout/header-skeleton';
import HydrationTracker from '@/core/providers/hydration-tracker';
import StructuredData from '@/shared/ui/layout/Seo/StructuredData';
import { WebVitals } from './web-vitals';
import { cn } from '@/shared/utils';
import { NoScriptFallback, DomainHints } from '@/shared/ui/layout';
import { THEME_BOOTSTRAP_SCRIPT } from '@/shared/theme/theme-bootstrap';
import './globals.css'; // Global Tailwind CSS styles

const Header = dynamic(() => import('@/shared/ui/layout/header-wrapper'), {
  loading: () => <HeaderSkeleton />,
});

// ============================================================
// 1. VIEWPORT — Device adaptation
// ============================================================

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility (WCAG 1.4.10)
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

// ============================================================
// 2. METADATA — SEO, Social, PWA
// ============================================================

const verificationTokens = {
  ...(env.GOOGLE_SITE_VERIFICATION && { google: env.GOOGLE_SITE_VERIFICATION }),
  ...(env.YANDEX_VERIFICATION && { yandex: env.YANDEX_VERIFICATION }),
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),

  // Title configuration with template
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,

  // Author and creator
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,

  // Robots configuration for search engines
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  /*
   * No `icons` block: Next.js generates the icon links from the file
   * conventions `app/icon.png` and `app/apple-icon.png`.
   *
   * This previously declared `/favicon.ico`, `/apple-touch-icon.png` and a
   * `shortcut` — none of which existed in `public/`, all verified live as 404s.
   * Declaring an icon that is not there is worse than declaring none: the
   * browser requests it on every page load, fails, and falls back anyway.
   * Sourcing them from the file convention means the declaration and the asset
   * cannot disagree, because Next derives one from the other.
   */

  // PWA manifest
  manifest: '/manifest.json',

  // Open Graph for social media sharing (descriptive text & sizes)
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    /*
     * Deliberately no `title` or `description` here.
     *
     * Setting them pinned every page's social preview to the site defaults:
     * a shared link to /products announced "eShop", not "Products | eShop",
     * because a layout's openGraph fields are inherited by every child route
     * and override what Next would otherwise derive from each page's own
     * `title`/`description`. Omitting them lets that derivation happen, so each
     * page's preview describes that page.
     *
     * This also removes the reason a page would declare its own `openGraph`
     * block — which matters, because a page-level `openGraph` object replaces
     * the inherited one wholesale and, with it, the generated share image from
     * `app/opengraph-image.tsx`.
     */
    /*
     * No `images` here: `app/opengraph-image.tsx` generates it and Next injects
     * the tag. Both this and the Twitter block below pointed at
     * `${siteConfig.url}/og-image.png`, which 404s — so every shared link
     * rendered with a blank preview.
     */
  },

  // Twitter Card configuration — image supplied by app/twitter-image.tsx
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
  },

  // Search engine verification tokens
  ...(Object.keys(verificationTokens).length > 0 && {
    verification: verificationTokens,
  }),

  // App-specific metadata for mobile
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },

  // Format detection - disable auto-linking (prevents dynamic layout shifts)
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Content classification
  category: 'ecommerce',
  classification: 'Shopping',

  // Additional metadata for Windows tiles
  other: {
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-config': '/browserconfig.xml',
  },
};

// ============================================================
// 3. ROOT LAYOUT
// ============================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  if (process.env.NODE_ENV === 'development') {
    validateFonts();
  }

  const nonce = await getCSPNonce();
  // Seeds NextAuthProvider (see core/providers/NextAuthProvider.tsx) so
  // useSession() resolves synchronously on both server and client, instead
  // of the client updating it after mount — which is unsafe while a
  // Suspense boundary further down is still hydrating.
  const session = await auth();

  return (
    <html
      lang="en" // TODO: Make dynamic when dynamic i18n routing layout is integrated
      dir="ltr" // TODO: Make dynamic for RTL languages
      suppressHydrationWarning // Required for next-themes to prevent hydration mismatch on html
      className={fontClassNames} // Set custom font variables
    >
      <head>
        {/*
          Blocking theme script — prevents the light-then-dark flash.

          Allowed by CSP two ways: the per-request `nonce` below, and a
          SHA-256 hash pinned in shared/config/security-headers.ts. The hash is
          what covers statically-generated pages, where `nonce` is undefined
          because there are no request headers to read. See
          shared/theme/theme-bootstrap.ts for the full rationale.

          `suppressHydrationWarning` is REQUIRED here and must not be removed.
          Browsers implement "nonce hiding" (HTML spec, §nonce attributes): once
          the parser reads a `nonce` content attribute it moves the value to an
          internal slot and sets the attribute itself to the empty string, so
          that a same-origin script cannot exfiltrate the nonce by reading the
          DOM. React's hydration pass then compares the value it expects from
          the server payload against the empty string the DOM now reports, and
          flags a mismatch on every single page load.

          Nothing is actually wrong: the script ran, the CSP allowed it, and the
          real nonce is still in the element's internal slot. There is also
          nothing React can do about it — hence its own message, "This won't be
          patched up". Suppressing is the intended escape hatch for an attribute
          that legitimately differs between server and client, and it is the
          same approach shared/ui/layout/Seo/SafeJsonLd.tsx already takes for
          its own nonced <script>.

          Note this suppresses only THIS element, one level deep — it does not
          mask a genuine mismatch anywhere else in the tree.
        */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <DomainHints />
        <StructuredData nonce={nonce} />
      </head>
      <body
        className={cn(
          'bg-background text-foreground font-sans antialiased',
          'flex min-h-dvh flex-col',
          'overflow-x-hidden'
        )}
      >
        <NoScriptFallback />

        {/* Skip to main content for keyboard navigation (WCAG 2.4.1) */}
        <SkipToContent />

        {/* Provider hierarchy with error boundaries and state management */}
        <Providers session={session}>
          {/* HydrationTracker uses dynamic({ssr:false}) which requires a Suspense boundary */}
          <Suspense fallback={null}>
            <HydrationTracker />
            <WebVitals />
          </Suspense>

          {/* Header sits outside main content, isolated in an error boundary */}
          <AppErrorBoundary variant="header">
            <Suspense fallback={<HeaderSkeleton />}>
              <Header />
            </Suspense>
          </AppErrorBoundary>

          {/* Main content landmark — tabIndex={-1} is the SkipToContent target */}
          <AppErrorBoundary variant="page">
            <main
              id="main-content"
              tabIndex={-1}
              aria-label="Main content"
              className={cn('flex flex-1 flex-col', 'focus:outline-none')}
            >
              {children}
            </main>
          </AppErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
