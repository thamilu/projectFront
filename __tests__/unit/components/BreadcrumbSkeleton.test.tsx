import React from 'react';
import { render, screen } from '@testing-library/react';
import { BreadcrumbSkeleton } from '@/shared/ui/skeletons/breadcrumb-skeleton';

describe('BreadcrumbSkeleton', () => {
  it('renders with default props', () => {
    render(<BreadcrumbSkeleton />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText(/breadcrumb.*loading/i)).toBeInTheDocument();
  });

  it('renders correct number of levels', () => {
    const { container } = render(<BreadcrumbSkeleton levels={5} />);

    const skeletons = container.querySelectorAll('[role="presentation"]');
    expect(skeletons).toHaveLength(5);
  });

  it('renders correct number of separators', () => {
    render(<BreadcrumbSkeleton levels={4} />);

    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(3); // n-1 separators
  });

  it('supports custom separator', () => {
    render(<BreadcrumbSkeleton levels={3} separator=">" />);

    expect(screen.getAllByText('>')).toHaveLength(2);
  });

  it('applies custom widths', () => {
    const widths = [100, 200, 300];
    const { container } = render(<BreadcrumbSkeleton levels={3} widths={widths} />);

    const skeletons = container.querySelectorAll('[role="presentation"]');
    skeletons.forEach((skeleton, index) => {
      expect(skeleton).toHaveStyle({ width: `${widths[index]}px` });
    });
  });

  it('has proper accessibility attributes', () => {
    render(<BreadcrumbSkeleton />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/loading breadcrumb/i)).toHaveClass('sr-only');
  });

  it('returns null when levels is 0', () => {
    const { container } = render(<BreadcrumbSkeleton levels={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles negative levels gracefully', () => {
    const { container } = render(<BreadcrumbSkeleton levels={-1} />);
    expect(container.firstChild).toBeNull();
  });
});
