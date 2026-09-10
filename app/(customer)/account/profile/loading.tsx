import type { FC } from 'react';
import { PageContainer } from '@/shared/ui/layout/page-container';
import { BreadcrumbSkeleton } from '@/shared/ui/skeletons/breadcrumb-skeleton';
// Direct path, not the '@/features/users' barrel: that barrel also
// re-exports ProfileForm, which pulls in next-auth/react. loading.tsx is
// the first thing Next.js renders for this route — it shouldn't need to
// load the entire profile feature's dependency graph just for one
// skeleton component.
import { ProfileSkeleton } from '@/features/users/components/ProfileSkeleton';

/**
 * Profile Page Loading State
 *
 * Rendered automatically by Next.js when the profile page
 * is being loaded or when navigating to this route.
 *
 * Must mirror page.tsx's real layout (PageContainer size, top padding,
 * breadcrumb item count) — a mismatch here isn't cosmetic, it's a visible
 * layout shift (width/height jump) the instant the real content swaps in,
 * which is exactly what CLS-conscious loading states exist to prevent.
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/loading}
 */
const Loading: FC = () => {
  return (
    // No role="status"/aria-live wrapper here — ProfileSkeleton already is
    // one (role="status" aria-live="polite" aria-label="Loading your
    // profile"), and BreadcrumbSkeleton's own sr-only text would nest
    // inside it too. A second, competing live region around all of this
    // just means a screen reader user hears 2-3 overlapping "loading"
    // announcements for one loading state instead of one clear one.
    <PageContainer size="xl" className="pb-16">
      <div className="space-y-4">
        {/* page.tsx's real Breadcrumb has exactly 2 items (Account, Profile). */}
        <BreadcrumbSkeleton levels={2} />
        <ProfileSkeleton variant="full" />
      </div>
    </PageContainer>
  );
};

export default Loading;
