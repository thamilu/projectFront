import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormSkeleton } from '@/features/seller/components/FormSkeleton';

// Mock next-auth/react to prevent ESM import syntax errors during Jest barrel file resolution
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

// Mock leaflet to prevent ESM import syntax errors during Jest barrel file resolution
jest.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));
jest.mock('leaflet', () => ({
  icon: jest.fn(() => ({})),
  Marker: {
    prototype: {
      options: {
        icon: {},
      },
    },
  },
}));

describe('FormSkeleton Component', () => {
  it('renders root container with correct WCAG 2.2 AA loading semantics', () => {
    render(<FormSkeleton />);

    // Assert QA targeting data-testid
    const container = screen.getByTestId('form-skeleton');
    expect(container).toBeInTheDocument();

    // Assert ARIA accessibility specifications
    expect(container).toHaveAttribute('role', 'status');
    expect(container).toHaveAttribute('aria-busy', 'true');
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-label', 'Loading seller onboarding form');

    // Visually hidden screen reader notice is present
    const srNotice = screen.getByText('Loading seller onboarding form. Please wait...');
    expect(srNotice).toBeInTheDocument();
    expect(srNotice).toHaveClass('sr-only');
  });

  it('renders personal-info step fields as default layout', () => {
    render(<FormSkeleton />);

    // Default step is personal-info
    const fieldsSkeleton = screen.getByTestId('fields-skeleton');
    expect(fieldsSkeleton).toBeInTheDocument();
  });

  it('renders permanent-address step layout when stepId is permanent-address', () => {
    render(<FormSkeleton stepId="permanent-address" />);

    // Permanent address has specific fields (Address line 1, 2, pincode/city, state/country)
    const fieldsSkeleton = screen.getByTestId('fields-skeleton');
    expect(fieldsSkeleton).toBeInTheDocument();

    // Verify correct grid rows (4 groups total)
    const fieldGroups = fieldsSkeleton.querySelectorAll('.grid');
    expect(fieldGroups.length).toBe(4);
  });

  it('renders identity step layout with Business Categories when stepId is identity', () => {
    render(<FormSkeleton stepId="identity" />);

    // Identity skeleton has a specific test-id
    const identitySkeleton = screen.getByTestId('identity-step-skeleton');
    expect(identitySkeleton).toBeInTheDocument();
  });

  it('renders store step layout with separator and Google Maps when stepId is store', () => {
    render(<FormSkeleton stepId="store" />);

    const storeSkeleton = screen.getByTestId('store-step-skeleton');
    expect(storeSkeleton).toBeInTheDocument();
  });

  it('renders terms step notice and checkbox when stepId is terms', () => {
    render(<FormSkeleton stepId="terms" />);

    const termsSkeleton = screen.getByTestId('terms-step-skeleton');
    expect(termsSkeleton).toBeInTheDocument();
  });

  it('renders responsive stepper layout with both mobile progress and desktop circles', () => {
    const { container } = render(<FormSkeleton />);

    // Desktop stepper element is present
    const desktopStepper = container.querySelector('.hidden.md\\:flex');
    expect(desktopStepper).toBeInTheDocument();

    // Mobile stepper progress bar element is present
    const mobileStepper = container.querySelector('.flex.flex-col.md\\:hidden');
    expect(mobileStepper).toBeInTheDocument();
  });

  it('applies custom className to the root wrapper', () => {
    render(<FormSkeleton className="custom-wrapper-class" />);

    const container = screen.getByTestId('form-skeleton');
    expect(container).toHaveClass('custom-wrapper-class');
  });
});
