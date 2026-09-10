// ============================================================
// __tests__/unit/app/account-profile-loading.test.tsx
// app/(customer)/account/profile/loading.tsx must visually match
// page.tsx's real layout (container size, top padding, breadcrumb item
// count) so swapping the skeleton for real content doesn't shift layout,
// and must not stack multiple competing aria-live regions for one
// loading state.
// ============================================================

import { render, screen } from '@testing-library/react';
import Loading from '@/app/(customer)/account/profile/loading';

describe('Profile loading skeleton — matches the real page layout', () => {
  it('uses the same PageContainer size as the real page (xl, not lg)', () => {
    const { container } = render(<Loading />);
    // PageContainer's size="xl" resolves to max-w-7xl; page.tsx's real
    // ProfilePage uses size="xl" too — a mismatch here is a visible width
    // jump the instant real content replaces this skeleton.
    expect(container.querySelector('.max-w-7xl')).toBeInTheDocument();
    expect(container.querySelector('.max-w-6xl')).not.toBeInTheDocument();
  });

  it('renders exactly 2 breadcrumb skeleton levels, matching the real Account > Profile breadcrumb', () => {
    render(<Loading />);
    // BreadcrumbSkeleton wraps each level (a Skeleton block + optional
    // separator) in its own direct child <div>.
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav.children).toHaveLength(2 + 1); // 2 level wrappers + the sr-only status span
    expect(nav.querySelectorAll(':scope > div')).toHaveLength(2);
  });

  it('does not wrap the skeleton in a redundant, competing live region', () => {
    const { container } = render(<Loading />);
    // ProfileSkeleton already provides role="status"/aria-live="polite" —
    // there must be exactly one such region, not a duplicate outer one.
    const statusRegions = container.querySelectorAll('[role="status"]');
    expect(statusRegions).toHaveLength(1);
    expect(statusRegions[0]).toHaveAttribute('aria-label', 'Loading your profile');
  });
});
