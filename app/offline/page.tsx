import { WifiOff } from 'lucide-react';
import { EmptyState } from '@/shared/ui/atoms/empty-state';

/**
 * /offline — next-pwa's precached fallback document (see next.config.ts's
 * withPWA({ fallbacks: { document: '/offline' } })). Served when the user is
 * offline and requests a page that isn't already cached. Deliberately has no
 * data fetching, client interactivity, or navigation links that assume a
 * network connection — none of that would work while actually offline.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16">
      <EmptyState
        icon={<WifiOff className="h-10 w-10" aria-hidden="true" />}
        title="You're offline"
        description="This page hasn't been loaded before, so it isn't available without an internet connection. Reconnect and try again."
        className="max-w-md"
      />
    </div>
  );
}
