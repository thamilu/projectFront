import { Loading } from '@/shared/ui/feedback/loading';

/**
 * Root loading fallback.
 *
 * The message was previously "Loading your dashboard…" — the root fallback for
 * a public storefront announcing a dashboard, which is wrong for every route
 * except one and actively confusing for an anonymous visitor on the homepage.
 * Route groups that genuinely load a dashboard supply their own copy.
 */
export default function LoadingPage() {
  return <Loading message="Loading…" size="md" fullScreen />;
}
