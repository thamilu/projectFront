import React from 'react';
import { render, screen } from '@testing-library/react';
import { BenefitsSkeleton } from '@/features/seller/components/BenefitsSkeleton';

describe('BenefitsSkeleton Component', () => {
  it('has displayName "BenefitsSkeleton"', () => {
    expect(BenefitsSkeleton.displayName).toBe('BenefitsSkeleton');
  });

  it('renders correctly with data-testid', () => {
    render(<BenefitsSkeleton />);
    const root = screen.getByTestId('benefits-skeleton');
    expect(root).toBeInTheDocument();
  });

  it('renders default card count (6 cards)', () => {
    const { container } = render(<BenefitsSkeleton />);
    // The skeleton cards have class "rounded-2xl border border-border bg-card p-6"
    // Let's count them by searching for cards that match this visual structure
    const cards = container.querySelectorAll('.bg-card');
    expect(cards).toHaveLength(6);
  });

  it('renders custom card count when count prop is provided', () => {
    const { container } = render(<BenefitsSkeleton count={3} />);
    const cards = container.querySelectorAll('.bg-card');
    expect(cards).toHaveLength(3);
  });

  it('bounds checks the count prop (minimum 1 card)', () => {
    const { container } = render(<BenefitsSkeleton count={0} />);
    const cards = container.querySelectorAll('.bg-card');
    expect(cards).toHaveLength(1);
  });

  it('bounds checks the count prop (maximum 12 cards)', () => {
    const { container } = render(<BenefitsSkeleton count={20} />);
    const cards = container.querySelectorAll('.bg-card');
    expect(cards).toHaveLength(12);
  });

  it('contains proper accessibility properties for screen readers and decorative content', () => {
    const { container } = render(<BenefitsSkeleton />);

    // Screen reader loading announcement is present
    const statusMsg = screen.getByRole('status');
    expect(statusMsg).toBeInTheDocument();
    expect(statusMsg).toHaveClass('sr-only');
    expect(statusMsg).toHaveAttribute('aria-live', 'polite');
    expect(statusMsg).toHaveTextContent(/loading benefits, please wait/i);

    // Decorative skeleton grid container is hidden from assistive tech
    const visualWrapper = container.querySelector('[aria-hidden="true"]');
    expect(visualWrapper).toBeInTheDocument();
    expect(visualWrapper).toHaveClass('animate-pulse');
    expect(visualWrapper).toHaveClass('motion-reduce:animate-none');
  });

  it('propagates the className prop to the outer container', () => {
    render(<BenefitsSkeleton className="custom-class-override mt-24" />);
    const root = screen.getByTestId('benefits-skeleton');
    expect(root).toHaveClass('custom-class-override');
    expect(root).toHaveClass('mt-24');
    expect(root).not.toHaveClass('mt-12'); // Make sure default margin is overridden
  });
});
