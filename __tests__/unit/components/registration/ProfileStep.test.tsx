import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { ProfileStep } from '@/features/seller/components/steps/ProfileStep';
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

// Mock react-hook-form
jest.mock('react-hook-form', () => {
  const original = jest.requireActual('react-hook-form');
  return {
    ...original,
    useWatch: ({ name }: { name: string }) => {
      const values: Record<string, string> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };
      return values[name];
    },
    useFormContext: () => {
      const context = original.useFormContext();
      return {
        ...context,
        register: jest.fn(() => ({})),
        control: {},
        formState: { errors: mockErrors },
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
        'sellerOnboarding.profile.title': 'Profile Confirmation',
        'sellerOnboarding.profile.description': 'Confirm your contact details and permanent residence.',
        'sellerOnboarding.profile.emailLockedHint': 'Email address cannot be changed here. Contact support to update your email.',
        'sellerOnboarding.profile.placeholders.notProvided': 'Not provided',
        'sellerOnboarding.personalInfo.title': 'Personal Information',
        'sellerOnboarding.personalInfo.fields.firstName': 'First Name',
        'sellerOnboarding.personalInfo.fields.lastName': 'Last Name',
        'sellerOnboarding.personalInfo.fields.email': 'Email Address',
        'sellerOnboarding.personalInfo.fields.phone': 'Mobile Number',
        'sellerOnboarding.permanentAddress.title': 'Permanent Address',
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
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '9876543210',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('ProfileStep Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrors = {};
  });

  it('renders ProfileStep with localized text and correct layout components', () => {
    render(
      <FormWrapper>
        <ProfileStep />
      </FormWrapper>
    );

    // Verify Title & Description
    expect(screen.getByTestId('profile-step')).toBeInTheDocument();
    expect(screen.getByText('Profile Confirmation')).toBeInTheDocument();
    expect(screen.getByText('Confirm your contact details and permanent residence.')).toBeInTheDocument();

    // Verify form sections
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Permanent Address')).toBeInTheDocument();

    // Verify inputs render with correct RHF watched values
    const firstNameInput = screen.getByTestId('profile-first-name');
    expect(firstNameInput).toHaveValue('John');
    expect(firstNameInput).toHaveAttribute('readonly');

    const lastNameInput = screen.getByTestId('profile-last-name');
    expect(lastNameInput).toHaveValue('Doe');
    expect(lastNameInput).toHaveAttribute('readonly');

    const emailInput = screen.getByTestId('profile-email');
    expect(emailInput).toHaveValue('john.doe@example.com');
    expect(emailInput).toHaveAttribute('readonly');

    // Verify analytics tracking
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_step_viewed', {
      step: 'profile',
      step_number: 1.5,
    });
  });

  it('announces validation errors through aria-live region and triggers telemetry', () => {
    mockErrors = {
      phone: { message: 'Phone number is invalid' },
    };

    render(
      <FormWrapper>
        <ProfileStep />
      </FormWrapper>
    );

    // Verify live region error announcer
    const announcer = screen.getByTestId('profile-sr-announcement');
    expect(announcer).not.toBeEmptyDOMElement();

    // Verify telemetry error track event
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_profile_validation_error', {
      fields: ['phone'],
    });
  });
});
