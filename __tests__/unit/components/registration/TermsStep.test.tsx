import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { TermsStep } from '@/features/seller/components/steps/TermsStep';
import { trackEvent } from '@/core/providers/analytics-provider';

// Mock ResizeObserver and scroll helpers
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollTo = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

let mockErrors: Record<string, { message: string }> = {};
let mockIsSubmitting = false;
let mockWatchValue = false;
const mockSetValue = jest.fn();

// Mock react-hook-form
jest.mock('react-hook-form', () => {
  const original = jest.requireActual('react-hook-form');
  return {
    ...original,
    useFormContext: () => {
      const context = original.useFormContext();
      return {
        ...context,
        register: jest.fn(() => ({})),
        control: {},
        watch: (name: string) => {
          if (name === 'acceptedTerms') return mockWatchValue;
          return false;
        },
        setValue: mockSetValue,
        formState: {
          ...context?.formState,
          errors: mockErrors,
          isSubmitting: mockIsSubmitting,
        },
      };
    },
    useWatch: ({ name }: { name: string }) => {
      if (name === 'acceptedTerms') return mockWatchValue;
      return false;
    },
  };
});

// Mock framer-motion to support reduced motion queries
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  useReducedMotion: () => false,
}));

// Mock logger to avoid telemetry side-effects in unit tests
jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock i18n localization
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.terms.title': 'Final Agreement',
        'sellerOnboarding.terms.description': 'Review our seller terms and conditions to complete your registration.',
        'sellerOnboarding.terms.agreementTitle': 'Seller Agreement',
        'sellerOnboarding.terms.agreementDescription': 'By becoming a seller on eShop, you agree to platform fees...',
        'sellerOnboarding.terms.importantNoteTitle': 'Important Note',
        'sellerOnboarding.terms.importantNoteDescription': 'Approval typically takes 24-48 hours...',
        'sellerOnboarding.terms.checkboxLabelPrefix': 'I accept the',
        'sellerOnboarding.terms.checkboxLabelLinkText': 'eShop Seller Terms and Conditions',
        'sellerOnboarding.terms.checkboxDescription': 'I confirm that all provided information is accurate...',
        'sellerOnboarding.terms.readyToSubmit': 'Terms accepted ✓',
        'sellerOnboarding.terms.validationError': 'You must accept the terms and conditions to proceed.',
        'common.opensInNewTab': '(opens in a new tab)',
        'sellerOnboarding.terms.merchantNoticesRegionLabel': 'Merchant Notices',
      };
      return translations[key] || (options?.defaultValue as string) || key;
    },
  }),
}));

interface WrapperProps {
  children: React.ReactNode;
}

function FormWrapper({ children }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      acceptedTerms: false,
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('TermsStep Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrors = {};
    mockIsSubmitting = false;
    mockWatchValue = false;
  });

  it('renders TermsStep and dispatches view analytics event', () => {
    render(
      <FormWrapper>
        <TermsStep />
      </FormWrapper>
    );

    // Verify step headings and descriptions
    expect(screen.getByTestId('terms-step')).toBeInTheDocument();
    expect(screen.getByText('Final Agreement')).toBeInTheDocument();
    expect(screen.getByText('Seller Agreement')).toBeInTheDocument();
    expect(screen.getByText('Important Note')).toBeInTheDocument();

    // Verify checkbox link is in the Document
    expect(screen.getByRole('link', { name: /eShop Seller Terms and Conditions/ })).toBeInTheDocument();

    // Verify analytics tracking on mount
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_step_viewed', {
      step: 'terms_agreement',
      step_number: 6,
      terms_version: '1.0',
    });
  });

  it('handles checkbox toggle actions correctly and records events', () => {
    render(
      <FormWrapper>
        <TermsStep />
      </FormWrapper>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    // Simulate clicking checkbox to accept
    fireEvent.click(checkbox);
    expect(mockSetValue).toHaveBeenCalledWith('acceptedTerms', true, {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it('displays validation error and configures ARIA attributes when verification fails', () => {
    mockErrors = {
      acceptedTerms: { message: 'TERMS_NOT_ACCEPTED' },
    };

    render(
      <FormWrapper>
        <TermsStep />
      </FormWrapper>
    );

    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent('You must accept the terms and conditions to proceed.');

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('aria-describedby', 'acceptedTerms-error');
  });

  it('disables the acceptance checkbox when the form is in submitting state', () => {
    mockIsSubmitting = true;

    render(
      <FormWrapper>
        <StoreStepWrapper />
      </FormWrapper>
    );

    function StoreStepWrapper() {
      return (
        <FormWrapper>
          <TermsStep />
        </FormWrapper>
      );
    }

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('renders a status banner when the terms are accepted', () => {
    mockWatchValue = true;

    render(
      <FormWrapper>
        <TermsStep />
      </FormWrapper>
    );

    const successBanner = screen.getByRole('status');
    expect(successBanner).toHaveTextContent('Terms accepted ✓');
  });

  it('contains data-testid attributes for testing convenience', () => {
    mockWatchValue = true;
    render(
      <FormWrapper>
        <TermsStep />
      </FormWrapper>
    );

    expect(screen.getByTestId('accepted-terms-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('accepted-terms-success')).toBeInTheDocument();
  });

  it('displays the localized opensInNewTab warning for screen reader users', () => {
    render(
      <FormWrapper>
        <TermsStep />
      </FormWrapper>
    );

    const srText = screen.getByText('(opens in a new tab)');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('sr-only');
  });
});
