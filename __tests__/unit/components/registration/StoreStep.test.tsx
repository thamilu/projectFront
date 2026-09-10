import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { StoreStep } from '@/features/seller/components/steps/StoreStep';
import { trackEvent } from '@/core/providers/analytics-provider';
import { SellerBusinessType } from '@/domains/seller/contracts/seller.types';

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

// BankDetailsFields (rendered inside StoreStep as of the bank-details
// wiring — see StoreStep.tsx) calls the real useQuery for its IFSC lookup,
// which needs a QueryClientProvider ancestor this test's render tree
// doesn't set up. Mocked here rather than adding a provider, consistent
// with this file's existing granular-mock style for other dependencies.
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

let shouldMockDetailsCrash = false;

jest.mock('@/features/seller/components/StoreDetailsFields', () => {
  const Actual = jest.requireActual('@/features/seller/components/StoreDetailsFields').StoreDetailsFields;
  const Mocked = (props: any) => {
    if (shouldMockDetailsCrash) {
      throw new Error('Mock Render Crash');
    }
    return <Actual {...props} />;
  };
  Mocked.displayName = 'StoreDetailsFields';
  return { StoreDetailsFields: Mocked };
});

let mockErrors: Record<string, { message: string }> = {};
let mockBusinessTypes: SellerBusinessType[] = [];
let mockIsSubmitting = false;

// Mock react-hook-form
jest.mock('react-hook-form', () => {
  const original = jest.requireActual('react-hook-form');
  return {
    ...original,
    useWatch: ({ name }: { name: string }) => {
      const values: Record<string, string | boolean | SellerBusinessType[]> = {
        shopName: 'Acme Store',
        shopHandle: 'acme-store',
        businessTypes: mockBusinessTypes,
        isOwnProduce: true,
      };
      return values[name];
    },
    useFormContext: () => {
      const context = original.useFormContext();
      return {
        ...context,
        register: jest.fn(() => ({})),
        control: {},
        watch: (name: string) => {
          const values: Record<string, string | boolean | SellerBusinessType[]> = {
            shopName: 'Acme Store',
            shopHandle: 'acme-store',
            businessTypes: mockBusinessTypes,
            isOwnProduce: true,
          };
          return values[name];
        },
        setValue: jest.fn(),
        setError: jest.fn(),
        clearErrors: jest.fn(),
        formState: {
          ...context?.formState,
          errors: mockErrors,
          dirtyFields: {},
          isSubmitting: mockIsSubmitting,
        },
      };
    },
  };
});

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock locations fetch hook
jest.mock('@/features/locations/hooks/use-locations', () => ({
  useLocations: () => ({
    pincodeData: null,
    localityOptions: [],
    searchedPincodeOptions: [],
    countryOptions: [],
    stateOptions: [],
    districtOptions: [],
    talukOptions: [],
    isValidPincode: false,
    hasLocalities: false,
    isIndia: true,
    isLoadingPincodeData: false,
    isLoadingPincodeSearch: false,
    isLoadingStates: false,
    isLoadingDistricts: false,
    isLoadingTaluks: false,
  }),
}));

// Mock i18n localization
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.store.title': 'Store Setup',
        'sellerOnboarding.store.description': 'Define how your brand will appear to customers.',
        'sellerOnboarding.store.fields.storeName.label': 'Store Display Name',
        'sellerOnboarding.store.fields.storeName.placeholder': 'e.g. Acme Electronics',
        'sellerOnboarding.store.fields.phone.label': 'Customer Support Phone',
        'sellerOnboarding.store.fields.phone.placeholder': '+91 98765 43210',
        'sellerOnboarding.store.fields.description.label': 'Store Description',
        'sellerOnboarding.store.fields.description.placeholder': 'Tell the world what makes your products special...',
        'sellerOnboarding.store.fields.shopHandle.label': 'Shop Handle (Unique ID)',
        'sellerOnboarding.store.fields.shopHandle.placeholder': 'my-awesome-shop',
        'sellerOnboarding.store.fields.shopHandle.hint': 'Your public URL will be: ',
        'sellerOnboarding.store.fields.shopLogoUrl.label': 'Shop Logo URL',
        'sellerOnboarding.store.fields.shopLogoUrl.placeholder': 'https://...',
        'sellerOnboarding.store.fields.farmerDetails.title': 'Farmer Details',
        'sellerOnboarding.store.fields.farmLocationVillage.label': 'Farm Location (Village)',
        'sellerOnboarding.store.fields.farmLocationVillage.placeholder': 'e.g. Rampur',
        'sellerOnboarding.store.fields.isOwnProduce.label': 'I am selling my own farm produce',
        'sellerOnboarding.store.fields.googleMapsUrl.label': 'Google Maps URL (Optional)',
        'sellerOnboarding.store.fields.googleMapsUrl.placeholder': 'https://goo.gl/maps/...',
        'sellerOnboarding.store.fields.googleMapsUrl.hint': 'Tip: Share your shop location link from Google Maps.',
        'sellerOnboarding.store.validationSummary': `${options?.count || 1} error(s) found.`,
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
      shopName: 'Acme Store',
      description: 'Cool description',
      businessPhone: '+919876543210',
      shopHandle: 'acme-store',
      shopLogoUrl: '',
      googleMapsUrl: '',
      farmLocationVillage: '',
      isOwnProduce: true,
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('StoreStep Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrors = {};
    mockBusinessTypes = [];
    mockIsSubmitting = false;
    shouldMockDetailsCrash = false;
  });

  it('renders StoreStep with inputs and dispatches view event', () => {
    render(
      <FormWrapper>
        <StoreStep />
      </FormWrapper>
    );

    // Verify layout
    expect(screen.getByTestId('store-step')).toBeInTheDocument();
    expect(screen.getByText('Store Setup')).toBeInTheDocument();
    expect(screen.getByText('Define how your brand will appear to customers.')).toBeInTheDocument();

    // Verify fields
    expect(screen.getByLabelText(/Store Display Name/)).toBeInTheDocument();
    expect(screen.getByLabelText('Customer Support Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Shop Handle (Unique ID)')).toBeInTheDocument();
    expect(screen.getByLabelText('Shop Logo URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Store Description')).toBeInTheDocument();

    // Verify analytics tracking
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_step_viewed', {
      step: 'store_setup',
      step_number: 5,
    });
  });

  it('renders Farmer details section if businessTypes includes FARMER', () => {
    mockBusinessTypes = [SellerBusinessType.FARMER];

    render(
      <FormWrapper>
        <StoreStep />
      </FormWrapper>
    );

    // Farmer section should render
    expect(screen.getByText('Farmer Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Farm Location (Village)')).toBeInTheDocument();
    expect(screen.getByLabelText('I am selling my own farm produce')).toBeInTheDocument();
  });

  it('updates live error announcer when form validations fail and dispatches error event', () => {
    mockErrors = {
      shopName: { message: 'Shop name must be at least 3 characters' },
    };

    render(
      <FormWrapper>
        <StoreStep />
      </FormWrapper>
    );

    // Confirm live region receives error message
    const announcer = screen.getByTestId('store-sr-announcement');
    expect(announcer).toHaveTextContent('1 error(s) found. Store Display Name: Shop name must be at least 3 characters');

    // Confirm telemetry error tracking with aliased field name
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_store_validation_error', {
      fields: ['store_name'],
    });
  });

  it('disables fields when form is in submitting state', () => {
    mockIsSubmitting = true;

    render(
      <FormWrapper>
        <StoreStep />
      </FormWrapper>
    );

    // Check store name input is disabled
    const storeInput = screen.getByLabelText(/Store Display Name/);
    expect(storeInput).toBeDisabled();

    // Check description textarea is disabled
    const descInput = screen.getByLabelText('Store Description');
    expect(descInput).toBeDisabled();
  });

  it('renders StepErrorFallback UI when a render error occurs in StoreDetailsFields', () => {
    shouldMockDetailsCrash = true;

    // Suppress console.error output for the duration of this expected crash test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FormWrapper>
        <StoreStep />
      </FormWrapper>
    );

    expect(screen.getByTestId('step-error-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong loading this step.')).toBeInTheDocument();

    spy.mockRestore();
  });
});
