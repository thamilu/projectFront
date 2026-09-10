/**
 * Delivery route-group layout.
 *
 * Wraps the delivery-agent console and its onboarding entry point.
 *
 * `noindex` for the same reason the seller group is: an internal operations
 * console has no place in search results, and its URLs reveal internal
 * structure. The `(delivery)` group previously had no layout at all, so it
 * inherited the root's `index: true`.
 *
 * @module app/(delivery)/layout
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    template: '%s | Delivery',
    default: 'Delivery',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function DeliveryLayout({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
