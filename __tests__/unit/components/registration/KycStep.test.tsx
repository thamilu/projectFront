import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { KycStep, retryImport } from '@/features/seller/components/steps/KycStep';
import { trackEvent } from '@/core/providers/analytics-provider';
import { logger } from '@/core/telemetry/logger';
import { refreshPage } from '@/shared/utils';
import { SellerIdentityType } from '@/domains/seller/contracts/seller.types';

// Mock shared utils to spy on refreshPage
jest.mock('@/shared/utils', () => {
  const originalModule = jest.requireActual('@/shared/utils');
  return {
    __esModule: true,
    ...originalModule,
    refreshPage: jest.fn(),
  };
});

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

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock logger
jest.mock('@/core/telemetry/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));


// Mock child components to prevent full lazy chunk loading in simple render tests,
// while letting us simulate throws for the ErrorBoundary test.
let shouldThrowError = false;
jest.mock('@/features/seller/components/steps/IndividualKycForm', () => {
  return {
    IndividualKycForm: () => {
      if (shouldThrowError) {
        throw new Error('Simulated load failure');
      }
      return <div data-testid="individual-kyc-form">Mock Individual KYC Form</div>;
    },
  };
});

jest.mock('@/features/seller/components/steps/BusinessKycForm', () => {
  return {
    BusinessKycForm: () => <div data-testid="business-kyc-form">Mock Business KYC Form</div>,
  };
});

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.kyc.header.title': 'Verify Your Identity',
        'sellerOnboarding.kyc.header.description': 'We need this to securely verify your seller status.',
        'sellerOnboarding.kyc.announcement.individual': 'Individual verification form loaded',
        'sellerOnboarding.kyc.announcement.business': 'Business verification form loaded',
        'sellerOnboarding.kyc.formGroup.label': 'Identity verification fields',
        'sellerOnboarding.kyc.errors.loadFailure': 'Something went wrong loading this step.',
        'common.retry': 'Try Again',
      };
      return translations[key] || (options?.defaultValue as string) || key;
    },
  }),
}));

interface WrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}

function FormWrapper({ children, defaultValues = {} }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      identityType: undefined,
      ...defaultValues,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('KycStep Component', () => {
  beforeAll(() => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    shouldThrowError = false;
  });

  it('renders standard layout structure, header, status live region, and form container', () => {
    render(
      <FormWrapper>
        <KycStep />
      </FormWrapper>
    );

    const section = screen.getByTestId('kyc-step');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('aria-labelledby', 'kyc-step-heading');
    expect(section).toHaveAttribute('aria-describedby', 'kyc-step-heading-desc');

    const heading = screen.getByTestId('kyc-step-heading');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'kyc-step-heading');
    expect(heading).toHaveTextContent('Verify Your Identity');

    const description = screen.getByTestId('kyc-step-description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveAttribute('id', 'kyc-step-heading-desc');
    expect(description).toHaveTextContent('We need this to securely verify your seller status.');

    expect(screen.getByTestId('kyc-live-region')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-form-container')).toBeInTheDocument();
  });

  it('announces form transitions in screen reader status live region when selection updates', async () => {
    function TestController() {
      const { setValue } = useFormContext();
      return (
        <div>
          <button onClick={() => setValue('identityType', 'INDIVIDUAL')}>Select Individual</button>
          <button onClick={() => setValue('identityType', 'BUSINESS')}>Select Business</button>
        </div>
      );
    }

    render(
      <FormWrapper>
        <TestController />
        <KycStep />
      </FormWrapper>
    );

    const liveRegion = screen.getByTestId('kyc-live-region');
    // Initially identityType is undefined, liveRegion should be empty (no announcement)
    expect(liveRegion).toHaveTextContent('');

    // Trigger select individual
    fireEvent.click(screen.getByText('Select Individual'));
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Individual verification form loaded');
    });

    // Trigger select business
    fireEvent.click(screen.getByText('Select Business'));
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Business verification form loaded');
    });
  });

  it('manages focus order by programmatically targeting the form group container on change', async () => {
    jest.useFakeTimers();

    function TestController() {
      const { setValue } = useFormContext();
      return (
        <button onClick={() => setValue('identityType', 'BUSINESS')}>Select Business</button>
      );
    }

    render(
      <FormWrapper defaultValues={{ identityType: 'INDIVIDUAL' }}>
        <TestController />
        <KycStep />
      </FormWrapper>
    );

    const formGroup = screen.getByTestId('kyc-form-container');
    expect(document.activeElement).not.toBe(formGroup);

    // Switch to BUSINESS
    fireEvent.click(screen.getByText('Select Business'));

    // Fast-forward animation timers
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(document.activeElement).toBe(formGroup);
    jest.useRealTimers();
  });

  it('restores focus and tracks telemetry across multiple subsequent switches', async () => {
    jest.useFakeTimers();

    function TestController() {
      const { setValue } = useFormContext();
      return (
        <div>
          <button onClick={() => setValue('identityType', 'INDIVIDUAL')}>Select Individual</button>
          <button onClick={() => setValue('identityType', 'BUSINESS')}>Select Business</button>
        </div>
      );
    }

    render(
      <FormWrapper defaultValues={{ identityType: 'INDIVIDUAL' }}>
        <TestController />
        <KycStep />
      </FormWrapper>
    );

    const formGroup = screen.getByTestId('kyc-form-container');

    // Switch to BUSINESS (second switch)
    fireEvent.click(screen.getByText('Select Business'));
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(document.activeElement).toBe(formGroup);
    expect(trackEvent).toHaveBeenCalledWith('identity_type_changed', {
      from: 'INDIVIDUAL',
      to: 'BUSINESS',
    });

    // Blur focus for next switch test
    act(() => {
      formGroup.blur();
    });
    expect(document.activeElement).not.toBe(formGroup);

    // Switch to INDIVIDUAL (third switch)
    fireEvent.click(screen.getByText('Select Individual'));
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(document.activeElement).toBe(formGroup);
    expect(trackEvent).toHaveBeenCalledWith('identity_type_changed', {
      from: 'BUSINESS',
      to: 'INDIVIDUAL',
    });

    jest.useRealTimers();
  });

  it('falls back to IndividualKycForm and logs error for unknown/invalid identityType enum value', () => {
    render(
      <FormWrapper defaultValues={{ identityType: 'UNKNOWN' as unknown as SellerIdentityType }}>
        <KycStep />
      </FormWrapper>
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('[KycStep] Unknown identityType selection: UNKNOWN')
    );
    expect(screen.getByTestId('individual-kyc-form')).toBeInTheDocument();
  });

  it('renders ErrorBoundary fallback retry view when form child throws error', () => {
    // Disable console.error log spam in test output since we expect a thrown error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    shouldThrowError = true;

    render(
      <FormWrapper defaultValues={{ identityType: 'INDIVIDUAL' }}>
        <KycStep />
      </FormWrapper>
    );

    expect(screen.getByTestId('kyc-form-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong loading this step.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();

    // Verify retry button resets boundary state
    shouldThrowError = false;
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    expect(screen.queryByTestId('kyc-form-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('individual-kyc-form')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renders ErrorBoundary fallback view with diagnostic context and tracks telemetry when component throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    shouldThrowError = true;

    render(
      <FormWrapper defaultValues={{ identityType: 'INDIVIDUAL' }}>
        <KycStep />
      </FormWrapper>
    );

    expect(screen.getByTestId('kyc-form-error')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-diagnostic-context')).toBeInTheDocument();
    expect(screen.getByText('Error Code: KYC_LOAD_FAILURE')).toBeInTheDocument();

    expect(trackEvent).toHaveBeenCalledWith('kyc_form_error', {
      error: 'Simulated load failure',
      identityType: 'INDIVIDUAL',
    });

    consoleSpy.mockRestore();
  });

  describe('retryImport helper', () => {
    it('resolves on the first attempt if the promise resolves successfully', async () => {
      const mockFn = jest.fn().mockResolvedValue('success-data');
      const result = await retryImport(mockFn, 3, 10);
      expect(result).toBe('success-data');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('retries when the promise fails and resolves if a retry succeeds', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success-on-retry');

      const result = await retryImport(mockFn, 3, 10);
      expect(result).toBe('success-on-retry');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('rejects standard errors after exhausting all retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Generic failure'));
      await expect(retryImport(mockFn, 2, 10)).rejects.toThrow('Generic failure');
      expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('triggers page reload if it exhausts retries and detects a ChunkLoadError', async () => {
      const chunkError = new Error('Loading chunk 123 failed.');
      chunkError.name = 'ChunkLoadError';
      const mockFn = jest.fn().mockRejectedValue(chunkError);

      await expect(retryImport(mockFn, 1, 10)).rejects.toThrow('Loading chunk 123 failed.');
      expect(mockFn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
      expect(refreshPage).toHaveBeenCalled();
    });
  });
});
