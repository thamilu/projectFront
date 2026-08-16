import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SellerHeaderProgress } from '@/features/seller/components/layout/SellerHeaderProgress';
import { useOnboardingStore } from '@/features/seller/store/onboarding-store';

// Mock i18n translator
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: jest.fn((key, params) => {
      if (key === 'sellerOnboarding.progress.stepText') {
        return `Step ${params.current} of ${params.total}`;
      }
      return key;
    }),
  }),
}));

describe('SellerHeaderProgress Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useOnboardingStore.setState({
        currentStep: 0,
        totalSteps: 4,
        stepTitle: 'Business Details',
      });
    });
  });

  it('should define correct displayName and named export only', () => {
    expect(SellerHeaderProgress.displayName).toBe('SellerHeaderProgress');
  });

  it('should return null when isWizardFlow is false', () => {
    const { container } = render(<SellerHeaderProgress isWizardFlow={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render mobile text fallback progress details and desktop progress bar layout when isWizardFlow is true', () => {
    render(<SellerHeaderProgress isWizardFlow={true} />);
    
    // Mobile text fallback check
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getAllByTitle('Business Details').length).toBe(2);

    // Desktop step title and step text check
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('should apply correct ARIA progressbar attributes to the track container element', () => {
    render(<SellerHeaderProgress isWizardFlow={true} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '25'); // Math.round((1/4)*100) = 25
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Seller onboarding step progress');
    expect(progressBar).toHaveAttribute('aria-valuetext', 'Step 1 of 4 — Business Details');
  });

  it('should guard against division by zero when totalSteps is 0', () => {
    act(() => {
      useOnboardingStore.setState({
        currentStep: 0,
        totalSteps: 0,
        stepTitle: 'Intro',
      });
    });

    render(<SellerHeaderProgress isWizardFlow={true} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should render a fallback step title if stepTitle is missing from store', () => {
    act(() => {
      useOnboardingStore.setState({
        stepTitle: '',
      });
    });

    render(<SellerHeaderProgress isWizardFlow={true} />);
    expect(screen.getAllByText(/Onboarding/i).length).toBeGreaterThan(0);
  });
});
