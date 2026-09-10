import type { Metadata } from 'next';
import { siteConfig } from '@/core/config/site';

/**
 * Generates canonical SEO metadata for the homepage.
 * Includes Open Graph cards, Twitter verification tags, robots guidelines,
 * app-like configurations, and format tracking restrictions.
 *
 * @returns Fully constructed Metadata object for Next.js App Router.
 */
export function generateHomeMetadata(): Metadata {
  return {
    /*
     * No `title` block. This duplicated the root layout's definition
     * verbatim, and the layout's template was then applied to this page's own
     * `default`, rendering the homepage tab as "eShop | eShop". Inheriting
     * gives the correct bare site name.
     */
    description: siteConfig.description,
    keywords: siteConfig.keywords ?? [
      'enterprise',
      'dashboard',
      'saas',
      siteConfig.name.toLowerCase(),
    ],
    authors: [
      {
        name:
          typeof siteConfig.author === 'string'
            ? siteConfig.author
            : (siteConfig.author?.name ?? siteConfig.name),
        ...(typeof siteConfig.author === 'object' &&
          siteConfig.author?.url && {
            url: siteConfig.author.url,
          }),
      },
    ],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    metadataBase: new URL(siteConfig.url),

    /*
     * No `openGraph` block.
     *
     * It duplicated `type`, `url`, `siteName`, `title` and `description` — all
     * of which the root layout already supplies or Next derives from the
     * top-level fields above. Worse, declaring it at page level replaces the
     * inherited openGraph wholesale, which is what stripped the generated share
     * image from `app/opengraph-image.tsx` off the homepage: the single
     * most-shared URL on the site had a blank social preview.
     */
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.name,
      description: siteConfig.description,
      creator: siteConfig.twitterHandle || undefined,
      // Image supplied by app/twitter-image.tsx — see the note above.
    },

    alternates: {
      canonical: siteConfig.url,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Conditionally include verification only if defined in the site configuration
    ...(siteConfig.verification && {
      verification: siteConfig.verification,
    }),

    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteConfig.name,
    },

    formatDetection: {
      telephone: false,
    },
  };
}
