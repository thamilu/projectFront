/**
 * Root Layout
 *
 * Enterprise-grade root layout with:
 * - Proper metadata configuration (Next.js 14+ standards)
 * - Performance-optimized font loading
 * - Accessibility features (skip-to-content, screen reader announcements)
 * - Security headers and CSP preparation
 * - SEO optimization (Open Graph, Twitter Cards, structured data)
 * - PWA support with manifest
 * - Theme support with no flash
 *
 * @module app/layout
 */

import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { fontClassNames } from '@/lib/fonts';
import { siteConfig } from '@/lib/config/site';
import { Providers } from './providers';
import { SkipToContent } from '@/components/layout/skip-to-content';
import Header from '@/components/layout/header-wrapper';
import { cn } from '@/lib/utils';
import './globals.css'; // Global Tailwind CSS styles

/**
 * Viewport Configuration (Next.js 14+ requirement)
 *
 * CRITICAL FIX: Separated from metadata to comply with Next.js 14+ API.
 * maximumScale=5 allows zoom for accessibility (WCAG 2.1 - Reflow 1.4.10).
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

/**
 * Base Metadata Configuration
 *
 * Comprehensive SEO setup with:
 * - Dynamic title templating
 * - Open Graph for social sharing
 * - Twitter Cards for Twitter sharing
 * - Robots configuration for search engines
 * - Verification tokens for search console
 * - PWA manifest
 */
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
  publisher: siteConfig.author.name,

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

  // Icons configuration for multiple platforms
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },

  // PWA manifest
  manifest: '/manifest.json',

  // Open Graph for social media sharing
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },

  // Twitter Card configuration
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
    creator: siteConfig.twitterHandle,
    site: siteConfig.twitterHandle,
  },

  // Search engine verification tokens
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },

  // App-specific metadata for mobile
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name,
  },

  // Format detection - disable auto-linking
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Content classification
  category: 'ecommerce',
  classification: 'Shopping',

  // Alternate languages for internationalization
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'en-US': `${siteConfig.url}/en`,
    },
  },

  // Additional metadata for Windows tiles
  other: {
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-config': '/browserconfig.xml',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root Layout Component
 *
 * Server Component that provides:
 * - HTML document structure
 * - Font loading with CSS variables
 * - Provider hierarchy
 * - Accessibility features
 * - Performance optimizations
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  // Read per-request headers to expose the CSP nonce to client code via meta tag
  const h = await headers();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonce = (h as any).get?.('x-csp-nonce') ?? undefined;
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning // Required for next-themes to prevent hydration mismatch
      className={cn(fontClassNames, 'antialiased')}
    >
      <head>
        {/* Preconnect to critical origins for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for third-party domains */}
        {process.env.BACKEND_API_URL && (
          <link rel="dns-prefetch" href={new URL(process.env.BACKEND_API_URL).origin} />
        )}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className={cn(
          'bg-background text-foreground min-h-screen font-sans',
          'selection:bg-primary selection:text-primary-foreground',
          'overflow-x-hidden'
        )}
      >
        {/* Skip to main content for keyboard navigation (WCAG 2.4.1) */}
        <SkipToContent />

        {/* Provider hierarchy with error boundaries and state management */}
        <Providers>
          {/* Header persists across all routes */}
          <Header />

          {/* Page content */}
          {children}
        </Providers>

        {/* Noscript fallback for users without JavaScript */}
        <noscript>
          <div className="bg-background fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="bg-card max-w-md rounded-lg border p-6 text-center shadow-lg">
              <h1 className="text-foreground text-xl font-bold">JavaScript Required</h1>
              <p className="text-muted-foreground mt-2">
                This application requires JavaScript to function properly. Please enable JavaScript
                in your browser settings and reload the page.
              </p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  );
}
