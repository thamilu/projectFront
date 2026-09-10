import React from 'react';
import { render, screen } from '@testing-library/react';
import { KycFormSkeleton } from '@/features/seller/components/steps/KycFormSkeleton';

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

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.kyc.skeleton.loadingLabel': 'Loading verification fields',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

describe('KycFormSkeleton Component', () => {
  it('renders default skeleton state (2 fields, single column) correctly', () => {
    const { container } = render(<KycFormSkeleton />);

    // Assert QA targeting data-testid
    const region = screen.getByTestId('kyc-form-skeleton');
    expect(region).toBeInTheDocument();

    // Assert ARIA accessibility specifications
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-label', 'Loading verification fields');

    // Default renders 2 fields: 2 labels (h-4) + 2 inputs (h-12) = 4 skeletons
    // Wait! Let's check how many elements with role presentation/aria-hidden are rendered
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    // Since each field has 1 label skeleton and 1 input skeleton, 2 fields -> 4 skeletons
    expect(skeletons.length).toBe(4);
  });

  it('renders configured fieldCount and columns correctly', () => {
    const { container } = render(<KycFormSkeleton fieldCount={4} columns={2} />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('md:grid-cols-2');

    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    // 4 fields -> 4 labels + 4 inputs = 8 skeletons
    expect(skeletons.length).toBe(8);
  });

  it('renders section headers when showSectionHeaders is true', () => {
    const { container } = render(<KycFormSkeleton fieldCount={4} showSectionHeaders={true} />);

    // 4 fields with showSectionHeaders -> will render section headers at boundaries.
    // For fieldCount=4, Math.ceil(4 / 2) = 2. Boundaries at index % 2 === 0, so index 0 and 2.
    // Each section header has 2 skeletons (icon + title).
    // Total skeletons = 4 fields * 2 (label + input) + 2 headers * 2 = 12 skeletons.
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(12);
  });

  it('applies custom test IDs and class names correctly', () => {
    render(<KycFormSkeleton data-testid="custom-skeleton" className="custom-spacing" />);

    const region = screen.getByTestId('custom-skeleton');
    expect(region).toBeInTheDocument();
    expect(region).toHaveClass('custom-spacing');
  });
});
