import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeSection } from '@/features/home/components/HomeSection';

beforeAll(() => {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error - jsdom doesn't implement IntersectionObserver
  global.IntersectionObserver = MockIntersectionObserver;

  // jsdom doesn't implement matchMedia — SectionReveal reads it for the
  // prefers-reduced-motion check.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

function WorkingComponent() {
  return <p>Section content</p>;
}

function ThrowingComponent(): never {
  throw new Error('Boom: section render failed');
}

function TestErrorFallback({ label }: { label?: string }) {
  return <p role="alert">{label ?? 'Something went wrong'}</p>;
}

function TestSkeleton() {
  return <p>Loading…</p>;
}

describe('HomeSection', () => {
  // Regression: ErrorFallback/errorFallbackProps were declared as required
  // props (and validated as required by createSectionsConfig), passed down
  // from HomePage, but never destructured or rendered inside HomeSection —
  // a throwing section crashed the entire homepage instead of degrading to
  // its own fallback.
  it('renders the ErrorFallback (not a crash) when the section component throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <HomeSection
        index={0}
        id="broken-section"
        ariaLabel="Broken section"
        Component={ThrowingComponent}
        Skeleton={TestSkeleton}
        ErrorFallback={TestErrorFallback}
        errorFallbackProps={{ label: 'This section is unavailable' }}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('This section is unavailable');
    expect(screen.queryByText('Section content')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renders the section component normally when it does not throw', () => {
    render(
      <HomeSection
        index={0}
        id="working-section"
        ariaLabel="Working section"
        Component={WorkingComponent}
        Skeleton={TestSkeleton}
        ErrorFallback={TestErrorFallback}
      />
    );

    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gives each section its own aria-label and test id', () => {
    render(
      <HomeSection
        index={2}
        id="categories"
        ariaLabel="Product categories"
        Component={WorkingComponent}
        Skeleton={TestSkeleton}
        ErrorFallback={TestErrorFallback}
      />
    );

    const section = screen.getByRole('region', { name: 'Product categories' });
    expect(section).toHaveAttribute('data-testid', 'section-categories');
  });
});
