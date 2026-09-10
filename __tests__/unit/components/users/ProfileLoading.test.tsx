import React from 'react';
import { render, screen } from '@testing-library/react';
import Loading from '@/app/(customer)/account/profile/loading';

describe('Profile Loading Page', () => {
  it('exposes exactly one status live region (ProfileSkeleton\'s own), not a redundant outer wrapper', () => {
    render(<Loading />);

    // Previously this file also wrapped everything in its own
    // role="status"/aria-label="Loading profile information" div, nested
    // around ProfileSkeleton's own role="status" region — a screen reader
    // user got 2-3 overlapping "loading" announcements for one loading
    // state. Removed: ProfileSkeleton's region is the single source now.
    const statusRegions = screen.getAllByRole('status');
    expect(statusRegions).toHaveLength(1);
    expect(statusRegions[0]).toHaveAttribute('aria-label', 'Loading your profile');
    expect(statusRegions[0]).toHaveAttribute('aria-busy', 'true');
    expect(statusRegions[0]).toHaveAttribute('aria-live', 'polite');
  });

  it('renders breadcrumb loading skeleton', () => {
    render(<Loading />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText(/breadcrumb.*loading/i)).toBeInTheDocument();
  });

  it('does not render a second, redundant "Loading profile" announcement outside ProfileSkeleton', () => {
    render(<Loading />);
    expect(screen.queryByText(/Loading profile\. Please wait\./i)).not.toBeInTheDocument();
  });
});
