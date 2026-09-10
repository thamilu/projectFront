/**
 * Customer route-group layout.
 *
 * Wraps every authenticated shopper page — account, cart, checkout, orders,
 * wishlist, settings and notifications.
 *
 * [PRIVACY] The single most important line in this file is
 * `robots: { index: false }`. The root layout declares `index: true`, and this
 * group had no layout to override it, so a customer's order history, cart and
 * checkout pages were all advertised as indexable. `app/robots.ts` only
 * partially compensated — it disallowed `/account/orders/` but not
 * `/account/`, `/settings/`, `/wishlist/`, `/orders/` or `/notifications/`.
 * Robots directives are also advisory to crawlers that choose to honour them,
 * whereas a `noindex` in the response is the stronger signal.
 *
 * @module app/(customer)/layout
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/shared/ui/layout';

export const metadata: Metadata = {
  title: {
    template: '%s | Your Account',
    default: 'Your Account',
  },
  robots: {
    index: false,
    follow: false,
    // Belt and braces: `nocache` and the googleBot block make the intent
    // explicit to crawlers that read only one of the two.
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
