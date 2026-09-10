import Link from 'next/link';
import { Truck } from 'lucide-react';
import { EmptyState } from '@/shared/ui/atoms/empty-state';
import { APP_ROUTES } from '@/shared/routes';

/**
 * /delivery — placeholder landing page for the DELIVERY_AGENT role.
 *
 * Access is already gated server-side by proxy.ts (RBAC_RULES requires
 * DELIVERY_AGENT — see proxy/config/rbac.config.ts), so this page only
 * needs to render for a user who has already passed that check.
 *
 * The real delivery-agent dashboard (assigned orders, route map, earnings —
 * see APP_ROUTES.DELIVERY in shared/routes/app-routes.ts for the planned
 * sub-routes) is a future-work item, not yet built. Until then this exists
 * so a delivery agent's first login lands on a real, on-brand page instead
 * of a 404 — the route group previously had zero files under it while both
 * RBAC and the /dashboard role redirect already pointed here.
 */
export default function DeliveryDashboardPlaceholderPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16">
      <EmptyState
        icon={<Truck className="h-10 w-10" aria-hidden="true" />}
        title="Delivery dashboard is coming soon"
        description="We're building out order assignments, route maps, and earnings tracking for delivery agents. This page will be your dashboard once it's ready."
        className="max-w-md"
      />
      <Link
        href={APP_ROUTES.HOME}
        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
      >
        Return to home
      </Link>
    </div>
  );
}
