import Link from 'next/link';
import { Truck } from 'lucide-react';
import { EmptyState } from '@/shared/ui/atoms/empty-state';
import { APP_ROUTES } from '@/shared/routes';

/**
 * /become-delivery-agent — placeholder. This route is already live in real
 * navigation (the main nav resolver — see role-navigation-resolver.ts), but
 * the full delivery-agent onboarding flow is a separately deferred feature
 * (delivery-agent functionality is being built out in a later phase). Until
 * then, this page tells the truth about that instead of leaving a
 * discoverable, tested nav link resolve to a hard 404.
 */
export default function BecomeDeliveryAgentPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16">
      <EmptyState
        icon={<Truck className="h-10 w-10" aria-hidden="true" />}
        title="Delivery agent onboarding is coming soon"
        description="We're building the ability to apply as a delivery agent directly from the app. Check back soon, or explore the platform in the meantime."
        className="max-w-md"
      />
      <Link
        href={APP_ROUTES.HOME}
        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
