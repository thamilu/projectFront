import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/shared/ui/atoms/empty-state';
import { APP_ROUTES } from '@/shared/routes';

/**
 * /compare — placeholder. There is no "add to compare" affordance anywhere
 * else in the app (product card, PDP) and no route links here, so this page
 * previously rendered a fully hardcoded product comparison that no real
 * user action could ever populate — indistinguishable from a working
 * feature but backed by nothing. A real client-side compare-list feature
 * (add products from the catalog, compare already-loaded data — no backend
 * endpoint would be needed) is a legitimate future feature, not a bug fix;
 * until it's built, this page tells the truth instead of faking it.
 */
export default function ComparePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16">
      <EmptyState
        icon={<BarChart3 className="h-10 w-10" aria-hidden="true" />}
        title="Product comparison is coming soon"
        description="We're building the ability to compare products side by side. In the meantime, browse the catalog to see full product details."
        className="max-w-md"
      />
      <Link
        href={APP_ROUTES.PRODUCTS}
        className="text-primary text-sm font-medium underline-offset-4 hover:underline"
      >
        Browse products
      </Link>
    </div>
  );
}
