/**
 * Root Not Found Page (404)
 *
 * Handles all unmatched routes at the application level.
 * Provides user-friendly error page with navigation options.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-muted-foreground/20 text-9xl font-bold">404</h1>
          <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
          <p className="text-muted-foreground text-lg">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        {/* Illustration or Icon */}
        <div className="flex justify-center">
          <div className="relative h-64 w-64">
            {/* You can replace this with an illustration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="text-muted-foreground/30 h-32 w-32" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" variant="default">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/products">
              <Search className="mr-2 h-5 w-5" />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="border-t pt-8">
          <p className="text-muted-foreground text-sm">
            If you believe this is an error, please{' '}
            <Link href="/contact" className="hover:text-foreground underline transition-colors">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
