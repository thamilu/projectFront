import HomePage from '@/components/home/HomePage';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/config/site';

/**
 * Home Page Route
 *
 * Server Component that renders the HomePage with streaming SSR.
 * All sections are streamed progressively via Suspense boundaries.
 */

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: {
    canonical: new URL('/', siteConfig.url).toString(),
  },
  openGraph: {
    type: 'website',
    title: siteConfig.name,
    description: siteConfig.description,
    url: new URL('/', siteConfig.url).toString(),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [
      {
        url: new URL(siteConfig.ogImage, siteConfig.url).toString(),
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [new URL(siteConfig.ogImage, siteConfig.url).toString()],
  },
};

export default function Page() {
  return <HomePage />;
}
