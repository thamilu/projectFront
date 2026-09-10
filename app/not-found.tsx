/**
 * 404 page.
 *
 * Two defects are fixed here:
 *
 * 1. **The heading structure was inverted.** `<h1>` held the decorative "404"
 *    glyph and `<h2>` held the actual message, so the page's accessible name —
 *    what a screen reader announces and what assistive navigation lands on —
 *    was the bare string "404". The glyph is now decorative and the message is
 *    the `<h1>`.
 *
 * 2. **It ignored the design system**, using `bg-gray-50`, `text-gray-200` and
 *    `bg-blue-600`, none of which have a dark variant.
 *
 * A server component: static, so it costs no client JavaScript.
 *
 * @module app/not-found
 */

import Link from 'next/link';
import { Home, Search, LifeBuoy } from 'lucide-react';
import { Button } from '@/shared/ui/atoms/button';
import { APP_ROUTES } from '@/shared/routes';

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        {/* Decorative: the number is conveyed by the heading below, so
            announcing "404" separately is noise. */}
        <p className="text-muted-foreground/25 text-8xl font-bold select-none" aria-hidden="true">
          404
        </p>

        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>

        <p className="text-muted-foreground mt-3">
          The page you&apos;re looking for doesn&apos;t exist, or it may have moved.
        </p>

        {/* Three routes onward rather than one. A 404 is a dead end only if the
            page makes it one; the previous version offered the homepage alone. */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href={APP_ROUTES.HOME}>
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={APP_ROUTES.PRODUCTS}>
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              Browse products
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-6 text-sm">
          <Link href={APP_ROUTES.HELP} className="inline-flex items-center gap-1 underline">
            <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
            Visit our help centre
          </Link>
        </p>
      </div>
    </div>
  );
}
