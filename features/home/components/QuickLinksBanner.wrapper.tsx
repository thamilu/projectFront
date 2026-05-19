'use client';

import dynamic from 'next/dynamic';

/**
 * Client-side wrapper for QuickLinksBanner component.
 * Uses dynamic import with ssr: false to prevent Radix UI Sheet/Dialog hydration mismatches.
 */
const QuickLinksBanner = dynamic(() => import('./QuickLinksBanner').then(mod => ({ default: mod.QuickLinksBanner })), {
  ssr: false,
  loading: () => (
    <section 
      className="bg-gradient-to-r from-primary to-secondary py-4" 
      aria-label="Quick navigation"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-10 w-10 bg-white/20 animate-pulse rounded-full flex-shrink-0" />
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-white/20 animate-pulse rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </section>
  ),
});

export default QuickLinksBanner;
