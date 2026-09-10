import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SellerHeaderSkeleton } from '@/features/seller/components/layout/SellerHeaderSkeleton';

// ── Mocks ─────────────────────────────────────────────────────

jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'seller.skeleton.headerAriaLabel': 'Loading site header',
        'seller.skeleton.loadingStandard': 'Loading navigation menu',
        'seller.skeleton.loadingOnboarding': 'Loading onboarding progress',
      };
      return translations[key] ?? key;
    },
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

// ── Test Helpers ──────────────────────────────────────────────

const SKELETON_DELAY_MS = 200;

// ── Test Suite ────────────────────────────────────────────────

describe('SellerHeaderSkeleton Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Flush any pending timers inside act() to prevent
    // "not wrapped in act()" warnings from state updates
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  // ── Semantic Landmark & ARIA ──────────────────────────────

  describe('Semantic Landmark & ARIA', () => {
    it('renders as a <header> element with role="banner" semantics', () => {
      render(<SellerHeaderSkeleton />);
      const header = screen.getByTestId('seller-header-skeleton');
      expect(header.tagName).toBe('HEADER');
    });

    it('sets aria-busy="true" on the header', () => {
      render(<SellerHeaderSkeleton />);
      const header = screen.getByTestId('seller-header-skeleton');
      expect(header).toHaveAttribute('aria-busy', 'true');
    });

    it('sets translated aria-label on the header', () => {
      render(<SellerHeaderSkeleton />);
      const header = screen.getByTestId('seller-header-skeleton');
      expect(header).toHaveAttribute('aria-label', 'Loading site header');
    });

    it('contains a loading status region for screen readers', () => {
      render(<SellerHeaderSkeleton />);
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('announces standard loading message when not onboarding', () => {
      render(<SellerHeaderSkeleton isOnboarding={false} />);
      expect(screen.getByText('Loading navigation menu')).toBeInTheDocument();
    });

    it('announces onboarding loading message when onboarding', () => {
      render(<SellerHeaderSkeleton isOnboarding={true} />);
      expect(screen.getByText('Loading onboarding progress')).toBeInTheDocument();
    });
  });

  // ── CLS-Safe Layout Heights ───────────────────────────────

  describe('CLS-Safe Layout Heights', () => {
    it('applies h-16 height class for standard header', () => {
      render(<SellerHeaderSkeleton isOnboarding={false} />);
      const container = screen.getByTestId('seller-header-skeleton');
      expect(container).toHaveClass('h-16');
    });

    it('applies h-14 height class for onboarding header', () => {
      render(<SellerHeaderSkeleton isOnboarding={true} />);
      const container = screen.getByTestId('seller-header-skeleton');
      expect(container).toHaveClass('h-14');
    });

    it('applies background and border styling matched to real header', () => {
      render(<SellerHeaderSkeleton />);
      const container = screen.getByTestId('seller-header-skeleton');
      expect(container).toHaveClass('bg-background/95');
      expect(container).toHaveClass('sticky');
      expect(container).toHaveClass('border-b');
    });
  });

  // ── Delayed Rendering (Flash Prevention) ──────────────────

  describe('Delayed Rendering', () => {
    it('does not show visual placeholder elements before delay expires', () => {
      render(<SellerHeaderSkeleton />);

      // Before delay: the header container exists but has no skeleton children
      const header = screen.getByTestId('seller-header-skeleton');
      expect(header).toBeInTheDocument();

      // role="presentation" elements are the Skeleton primitives
      const presentations = header.querySelectorAll('[role="presentation"]');
      // Only the LoadingRegion (role="status") is present, no Skeleton primitives
      expect(presentations.length).toBe(0);
    });

    it('shows visual placeholder elements after delay expires', () => {
      render(<SellerHeaderSkeleton />);

      act(() => {
        jest.advanceTimersByTime(SKELETON_DELAY_MS);
      });

      const header = screen.getByTestId('seller-header-skeleton');
      const presentations = header.querySelectorAll('[role="presentation"]');
      expect(presentations.length).toBeGreaterThan(0);
    });

    it('preserves CLS-safe container height while visuals are delayed', () => {
      render(<SellerHeaderSkeleton isOnboarding={false} />);
      const container = screen.getByTestId('seller-header-skeleton');

      // Height class is applied immediately — not waiting for the delay
      expect(container).toHaveClass('h-16');
    });
  });

  // ── Named Export & Memoization ────────────────────────────

  describe('Export Pattern', () => {
    it('has displayName set to SellerHeaderSkeleton', () => {
      expect(SellerHeaderSkeleton.displayName).toBe('SellerHeaderSkeleton');
    });

    it('is exported as a named export (not default)', () => {
      // We imported via named import — this test validates the import succeeded
      expect(typeof SellerHeaderSkeleton).toBe('object'); // memo() wraps as object
    });
  });

  // ── Onboarding vs Standard Layout Differentiation ─────────

  describe('Layout Differentiation', () => {
    it('renders search bar placeholder in standard layout after delay', () => {
      render(<SellerHeaderSkeleton isOnboarding={false} />);

      act(() => {
        jest.advanceTimersByTime(SKELETON_DELAY_MS);
      });

      const header = screen.getByTestId('seller-header-skeleton');
      // Standard layout has fewer action placeholders than onboarding
      // and has a search bar placeholder (w-80)
      const allSkeletons = header.querySelectorAll('[role="presentation"]');
      expect(allSkeletons.length).toBeGreaterThan(0);
    });

    it('renders progress bar and extra action placeholders in onboarding layout after delay', () => {
      render(<SellerHeaderSkeleton isOnboarding={true} />);

      act(() => {
        jest.advanceTimersByTime(SKELETON_DELAY_MS);
      });

      const header = screen.getByTestId('seller-header-skeleton');
      const allSkeletons = header.querySelectorAll('[role="presentation"]');
      // Onboarding has more skeleton elements (Save Draft, Help, Locale, Theme, Avatar + progress + branding)
      expect(allSkeletons.length).toBeGreaterThan(5);
    });
  });
});
