/**
 * Public route-group layout.
 *
 * Wraps every publicly-browsable page — storefront, catalogue, policy and
 * marketing pages.
 *
 * [GAP] Only the `(seller)` group previously had a layout. That absence meant:
 *
 * - **No footer anywhere.** `/terms`, `/privacy`, `/help`, `/about` and
 *   `/contact` all existed but were reachable only by typing the URL.
 * - **No group-level metadata**, so 52 of 64 pages inherited the root title and
 *   description verbatim — one description across the entire site.
 *
 * A server component: it adds a static shell and costs no client JavaScript.
 *
 * @module app/(public)/layout
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/shared/ui/layout';

/**
 * Group-level metadata.
 *
 * `robots.index` is left at the root's `true`: these pages *should* be
 * indexed. The authenticated groups override it to `false` — see
 * `app/(customer)/layout.tsx`.
 */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* `flex-1` lets the page grow and pins the footer to the bottom on
          short pages, working with the root layout's `min-h-dvh` column. */}
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
