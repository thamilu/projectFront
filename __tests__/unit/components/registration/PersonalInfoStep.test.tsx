import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { PersonalInfoStep } from '@/features/seller/components/steps/PersonalInfoStep';
import { trackEvent } from '@/core/providers/analytics-provider';

// Mock ResizeObserver and scroll helpers used by date picker / Radix components
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

// Dynamic mock variables for react-hook-form validation control
let mockErrors: Record<string, { message: string }> = {};
let mockTrigger = jest.fn().mockResolvedValue(true);

jest.mock('react-hook-form', () => {
  const original = jest.requireActual('react-hook-form');
  return {
    ...original,
    useFormContext: () => {
      const context = original.useFormContext();
      return {
        ...context,
        formState: {
          ...context?.formState,
          errors: mockErrors,
        },
        trigger: mockTrigger,
      };
    },
  };
});

// Mock analytics provider
jest.mock('@/core/providers/analytics-provider', () => ({
  trackEvent: jest.fn(),
}));

// Mock SellerFormUI hook
jest.mock('@/features/seller/hooks/useSellerFormUI', () => ({
  useSellerFormUI: () => ({
    mobileVerified: true,
    isPersonalInfoEditing: false,
    setIsPersonalInfoEditing: jest.fn(),
  }),
}));

// Mock localization
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.personalInfo.title': 'Personal Information',
        'sellerOnboarding.personalInfo.description': 'Manage your core profile identity and contact details.',
        'sellerOnboarding.personalInfo.editLabel': 'Edit Personal Info',
        'sellerOnboarding.personalInfo.lockLabel': 'Done Editing',
        'sellerOnboarding.personalInfo.ariaEditing': 'Fields are now editable. Make your changes and click Done Editing.',
        'sellerOnboarding.personalInfo.ariaLocked': 'Fields are locked. Click Edit Personal Info to make changes.',
        'sellerOnboarding.personalInfo.savedConfirmation': 'Personal information saved successfully.',
        'sellerOnboarding.personalInfo.emailLockedHint': 'Email address cannot be changed here. Contact support to update your email.',
        'sellerOnboarding.personalInfo.groups.name': 'Name',
        'sellerOnboarding.personalInfo.groups.contact': 'Contact',
        'sellerOnboarding.personalInfo.groups.demographics': 'Demographics',
        'sellerOnboarding.personalInfo.groups.preferences': 'Preferences',
        'sellerOnboarding.personalInfo.fields.firstName': 'First Name',
        'sellerOnboarding.personalInfo.fields.lastName': 'Last Name',
        'sellerOnboarding.personalInfo.fields.email': 'Email Address',
        'sellerOnboarding.personalInfo.fields.phone': 'Mobile Number',
        'sellerOnboarding.personalInfo.fields.gender': 'Gender',
        'sellerOnboarding.personalInfo.fields.dateOfBirth': 'Date of Birth',
        'sellerOnboarding.personalInfo.fields.alternatePhone': 'Alternate Phone',
        'sellerOnboarding.personalInfo.fields.preferredLanguage': 'Preferred Language',
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
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      alternatePhone: '',
      preferredLanguage: 'en',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('PersonalInfoStep Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrors = {};
    mockTrigger.mockReset();
    mockTrigger.mockResolvedValue(true);
  });

  it('renders with localized content and fires view event', () => {
    render(
      <FormWrapper>
        <PersonalInfoStep />
      </FormWrapper>
    );

    expect(screen.getByTestId('personal-info-step')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Manage your core profile identity and contact details.')).toBeInTheDocument();

    // Verify analytics tracking
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_step_viewed', {
      step: 'personal_info',
      step_number: 1,
    });
  });

  it('toggles to edit mode, updates live region, and shifts focus', async () => {
    render(
      <FormWrapper>
        <PersonalInfoStep />
      </FormWrapper>
    );

    const toggleButton = screen.getByTestId('personal-info-edit-toggle');
    const formGroup = screen.getByTestId('personal-info-form');
    const announcement = screen.getByTestId('personal-info-sr-announcement');

    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(formGroup).toHaveAttribute('aria-busy', 'false');
    expect(announcement.textContent).toBe('\u00A0');

    // Click to enter edit mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    expect(announcement).toHaveTextContent('Fields are now editable. Make your changes and click Done Editing.');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_personal_info_toggle', {
      action: 'edit_started',
    });

    // Check focus transition to first invalid/editable field (firstName)
    expect(document.activeElement?.id).toBe('firstName');
  });

  it('saves successfully when trigger validation passes', async () => {
    mockTrigger.mockResolvedValue(true);

    render(
      <FormWrapper>
        <PersonalInfoStep />
      </FormWrapper>
    );

    const toggleButton = screen.getByTestId('personal-info-edit-toggle');

    // Enter edit mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Exit edit mode (triggering validation)
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_personal_info_toggle', {
      action: 'lock_attempted',
    });
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_personal_info_saved', {
      step: 'personal_info',
    });

    // Confirm success message is visible and focus is restored to the toggle button
    expect(screen.getByTestId('personal-info-save-success')).toBeInTheDocument();
    expect(document.activeElement).toBe(toggleButton);
  });

  it('stays in edit mode and focuses first invalid field when validation fails', async () => {
    mockTrigger.mockResolvedValue(false);

    render(
      <FormWrapper>
        <PersonalInfoStep />
      </FormWrapper>
    );

    const toggleButton = screen.getByTestId('personal-info-edit-toggle');

    // Enter edit mode
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Set validation error mock
    mockErrors = {
      lastName: { message: 'Last name is required' },
    };

    // Attempt to lock/save
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Verify it stays in edit mode and shows error
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_personal_info_save_error', {
      error: 'Validation failed. Please check the fields below.',
    });
    expect(screen.getByTestId('personal-info-save-error')).toBeInTheDocument();

    // Verify focus shifted to the first invalid field
    expect(document.activeElement?.id).toBe('lastName');
  });

  it('supports keyboard shortcuts for toggling edit and cancelling', async () => {
    render(
      <FormWrapper>
        <PersonalInfoStep />
      </FormWrapper>
    );

    const toggleButton = screen.getByTestId('personal-info-edit-toggle');

    // Press Alt+E to edit
    await act(async () => {
      fireEvent.keyDown(window, { altKey: true, key: 'e' });
    });
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    // Press Escape to cancel
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    expect(trackEvent).toHaveBeenCalledWith('seller_onboarding_personal_info_edit_cancelled');
  });
});
