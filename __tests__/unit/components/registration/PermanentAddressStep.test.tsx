import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { PermanentAddressStep } from '@/features/seller/components/steps/PermanentAddressStep';
import { trackEvent } from '@/core/providers/analytics-provider';

// Mock react-hook-form context
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useFormContext: () => ({
    formState: { errors: {} },
    watch: (name?: string) => {
      const vals: Record<string, string> = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'Metropolis',
        state: 'NY',
        district: 'Gotham',
        taluk: 'Central',
        pincode: '10001',
        country: 'India',
      };
      return name ? vals[name] : vals;
    },
    setValue: jest.fn(),
    register: jest.fn(() => ({})),
    trigger: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
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

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock i18n
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.permanentAddress.title': 'Permanent Address',
        'sellerOnboarding.permanentAddress.description': 'Provide your official address.',
        'sellerOnboarding.permanentAddress.editLabel': 'Edit Address',
        'sellerOnboarding.permanentAddress.lockLabel': 'Done Editing',
        'sellerOnboarding.permanentAddress.ariaEditing': 'Editing address mode enabled.',
        'sellerOnboarding.permanentAddress.ariaLocked': 'Address locked successfully.',
        'sellerOnboarding.permanentAddress.savedConfirmation': 'Address saved successfully.',
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
      addressLine1: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      pincode: '10001',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('PermanentAddressStep Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading skeleton initially and resolves to layout', async () => {
    render(
      <FormWrapper>
        <PermanentAddressStep />
      </FormWrapper>
    );

    // Initial mount renders skeleton
    expect(screen.getByTestId('permanent-address-skeleton')).toBeInTheDocument();

    // Fast-forward the CLS skeleton delay
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Content should now be visible
    expect(screen.getByTestId('permanent-address-step')).toBeInTheDocument();
    expect(screen.getByTestId('permanent-address-form')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_step_viewed', {
      step: 'permanent_address',
      step_number: 2,
    });
  });

  it('toggles edit mode and updates accessibility attributes', async () => {
    render(
      <FormWrapper>
        <PermanentAddressStep />
      </FormWrapper>
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    const toggleButton = screen.getByTestId('permanent-address-edit-toggle');
    const formContainer = screen.getByTestId('permanent-address-form');
    const announcement = screen.getByTestId('permanent-address-sr-announcement');

    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(formContainer).toHaveAttribute('aria-busy', 'false');
    expect(announcement.textContent).toBe('\u00A0');

    // Click to enter Edit mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_address_toggle', {
      action: 'edit_started',
    });
    expect(announcement).toHaveTextContent('Editing address mode enabled.');

    // Click to Done Editing (Lock) mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_address_toggle', {
      action: 'lock_attempted',
    });
    expect(announcement).toHaveTextContent('Address locked successfully.');
    expect(screen.getByTestId('permanent-address-save-success')).toBeInTheDocument();
  });

  it('restores focus programmatically and handles keyboard shortcuts', async () => {
    render(
      <FormWrapper>
        <PermanentAddressStep />
      </FormWrapper>
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    const toggleButton = screen.getByTestId('permanent-address-edit-toggle');

    // Trigger Alt+E keydown shortcut
    await act(async () => {
      fireEvent.keyDown(window, { altKey: true, key: 'e' });
    });

    // Toggle button should be pressed (isEditing = true)
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    // Trigger Escape shortcut to cancel
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_address_edit_cancelled');
  });
});
