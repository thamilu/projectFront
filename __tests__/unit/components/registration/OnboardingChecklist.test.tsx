import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForm, FormProvider } from 'react-hook-form';
import { OnboardingChecklist } from '@/features/seller/components/registration/OnboardingChecklist';

expect.extend(toHaveNoViolations);

// Mock STEPS constants to be dynamic to avoid hoisting temporal dead zone (TDZ) issues
jest.mock('@/features/seller/constants/seller-form-steps', () => {
  const original = jest.requireActual('@/features/seller/constants/seller-form-steps');
  (global as any).__MOCK_CHECKLIST_STEPS__ = [
    { id: 'personal-info', title: 'Personal', description: 'Contact details' },
    { id: 'permanent-address', title: 'Address', description: 'Residential info' },
    { id: 'identity', title: 'Identity', description: 'Business type' },
    { id: 'kyc', title: 'Legal', description: 'KYC Verification' },
    { id: 'store', title: 'Store', description: 'Shop setup' },
    { id: 'terms', title: 'Terms', description: 'Agreement' },
  ];
  return {
    ...original,
    get STEPS() {
      return (global as any).__MOCK_CHECKLIST_STEPS__;
    },
  };
});

// Mock i18n translator
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.checklist.complianceTitle': 'Compliance Checks',
        'sellerOnboarding.checklist.live': 'Live',
        'sellerOnboarding.checklist.email': 'Email Verification',
        'sellerOnboarding.checklist.mobile': 'Mobile OTP Sync',
        'sellerOnboarding.checklist.kyc': 'Identity / KYC Checks',
        'sellerOnboarding.checklist.gst': 'GSTIN Tax Audit',
        'sellerOnboarding.checklist.verified': 'Verified',
        'sellerOnboarding.checklist.awaitingPhone': 'Awaiting Phone',
        'sellerOnboarding.checklist.verifyOtp': 'Verify OTP',
        'sellerOnboarding.checklist.completenessTitle': 'Profile Completeness',
        'sellerOnboarding.checklist.progressLabel': `Profile completeness: ${params?.percent}%`,
        'sellerOnboarding.checklist.requiredDocs': 'Required Documents',
        'sellerOnboarding.checklist.status.verified': 'VERIFIED',
        'sellerOnboarding.checklist.status.complete': 'COMPLETE',
        'sellerOnboarding.checklist.status.incomplete': 'INCOMPLETE',
        'sellerOnboarding.checklist.status.invalid': 'INVALID',
        'sellerOnboarding.checklist.status.pending': 'PENDING',
        'sellerOnboarding.checklist.status.underReview': 'UNDER REVIEW',
        'sellerOnboarding.checklist.status.rejected': 'REJECTED',
        'sellerOnboarding.checklist.status.error': 'ERROR',
        'sellerOnboarding.checklist.stepState.completed': 'Completed',
        'sellerOnboarding.checklist.stepState.current': 'Current Step',
        'sellerOnboarding.checklist.stepState.pending': 'Pending Step',
        'sellerOnboarding.assistant.docs.pan': 'PAN Card',
        'sellerOnboarding.assistant.docs.panHint': 'Individual/Business',
        'sellerOnboarding.assistant.docs.aadhar': 'Aadhaar Card',
        'sellerOnboarding.assistant.docs.aadharHint': 'Verification',
        'sellerOnboarding.assistant.docs.gstin': 'GSTIN',
        'sellerOnboarding.assistant.docs.gstinHint': 'Optional',
        'sellerOnboarding.assistant.docs.bank': 'Active Bank Account Details',
        'sellerOnboarding.assistant.docs.ssn': 'SSN or EIN',
        'sellerOnboarding.assistant.docs.govId': 'Government ID',
        'sellerOnboarding.steps.personal-info.title': 'Personal',
        'sellerOnboarding.steps.personal-info.description': 'Contact details',
        'sellerOnboarding.steps.permanent-address.title': 'Address',
        'sellerOnboarding.steps.permanent-address.description': 'Residential info',
        'sellerOnboarding.steps.identity.title': 'Identity',
        'sellerOnboarding.steps.identity.description': 'Business type',
        'sellerOnboarding.steps.kyc.title': 'Legal',
        'sellerOnboarding.steps.kyc.description': 'KYC Verification',
        'sellerOnboarding.steps.store.title': 'Store',
        'sellerOnboarding.steps.store.description': 'Shop setup',
        'sellerOnboarding.steps.terms.title': 'Terms',
        'sellerOnboarding.steps.terms.description': 'Agreement',
      };
      return translations[key] || key;
    },
    locale: 'en',
  }),
}));

interface WrapperProps {
  children: React.ReactNode;
  defaultValues?: any;
}

const TestWrapper = ({ children, defaultValues = {} }: WrapperProps) => {
  const methods = useForm({
    defaultValues,
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('OnboardingChecklist Component', () => {
  const defaultProps = {
    currentStep: 0,
    mobileVerified: false,
    onVerifyMobile: jest.fn(),
    emailVerified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__MOCK_CHECKLIST_STEPS__ = [
      { id: 'personal-info', title: 'Personal', description: 'Contact details' },
      { id: 'permanent-address', title: 'Address', description: 'Residential info' },
      { id: 'identity', title: 'Identity', description: 'Business type' },
      { id: 'kyc', title: 'Legal', description: 'KYC Verification' },
      { id: 'store', title: 'Store', description: 'Shop setup' },
      { id: 'terms', title: 'Terms', description: 'Agreement' },
    ];
  });

  it('has no accessibility violations in default state', async () => {
    const { container } = render(
      <TestWrapper>
        <OnboardingChecklist {...defaultProps} />
      </TestWrapper>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no accessibility violations in fully verified state', async () => {
    const { container } = render(
      <TestWrapper>
        <OnboardingChecklist
          {...defaultProps}
          emailVerified={true}
          mobileVerified={true}
          kycStatus="VERIFIED"
          gstStatus="VERIFIED"
        />
      </TestWrapper>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders all key elements with correct data-testid attributes', () => {
    render(
      <TestWrapper>
        <OnboardingChecklist {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('onboarding-checklist-container')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-widget')).toBeInTheDocument();
    expect(screen.getByTestId('email-verification-status')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-otp-status')).toBeInTheDocument();
    expect(screen.getByTestId('kyc-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('gst-status-badge')).toBeInTheDocument();
    expect(screen.getByTestId('profile-progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('step-checklist')).toBeInTheDocument();
  });

  it('correctly maps and updates progress completeness bar ARIA values for partial completion', () => {
    render(
      <TestWrapper
        defaultValues={{
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          gender: 'male',
          dateOfBirth: '1990-01-01',
        }}
      >
        <OnboardingChecklist {...defaultProps} />
      </TestWrapper>
    );

    // 1 of 6 steps complete = Math.round(1/6 * 100) = 17%
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '17');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Profile completeness: 17%');
  });

  it('correctly maps progress completeness bar ARIA values for full completion', () => {
    render(
      <TestWrapper
        defaultValues={{
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          gender: 'male',
          dateOfBirth: '1990-01-01',
          addressLine1: 'Address',
          city: 'City',
          district: 'District',
          state: 'State',
          pincode: '123456',
          identityType: 'INDIVIDUAL',
          businessTypes: ['RETAIL'],
          panNumber: 'ABCDE1234F',
          aadhar: '123456789012',
          shopName: 'Shop',
          storeAddressLine1: 'Address',
          storeCity: 'City',
          storeState: 'State',
          storePincode: '123456',
          shopHandle: 'handle',
          acceptedTerms: true,
        }}
      >
        <OnboardingChecklist {...defaultProps} />
      </TestWrapper>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('does NOT mark a step complete based on positional index values alone (visual lie fix)', () => {
    // If we are on step 3 but step 1 address info has been cleared / is incomplete
    render(
      <TestWrapper
        defaultValues={{
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          gender: 'male',
          dateOfBirth: '1990-01-01',
          // addressLine1 is empty (index 1 is incomplete)
          addressLine1: '',
        }}
      >
        <OnboardingChecklist {...defaultProps} currentStep={2} />
      </TestWrapper>
    );

    const addressStep = screen.getByTestId('step-item-permanent-address');
    expect(addressStep).toHaveAttribute('aria-label', 'Address: Pending Step');
  });

  it('OTP button has focus-visible outline and supports standard min-h-[44px] styling', () => {
    render(
      <TestWrapper defaultValues={{ phone: '+1234567890' }}>
        <OnboardingChecklist {...defaultProps} />
      </TestWrapper>
    );

    const otpBtn = screen.getByTestId('verify-otp-button');
    expect(otpBtn).toHaveClass('min-h-[44px]');
    expect(otpBtn).toHaveClass('focus-visible:ring-2');
    
    // Verify OTP callback clicks
    fireEvent.click(otpBtn);
    expect(defaultProps.onVerifyMobile).toHaveBeenCalledTimes(1);
  });

  it('renders correct document requirements dynamically based on market (IN vs US)', () => {
    const { rerender } = render(
      <TestWrapper defaultValues={{ identityType: 'INDIVIDUAL' }}>
        <OnboardingChecklist {...defaultProps} currentStep={3} market="IN" />
      </TestWrapper>
    );

    expect(screen.getByTestId('required-documents-preview')).toBeInTheDocument();
    expect(screen.getByText(/PAN Card/i)).toBeInTheDocument();
    expect(screen.getByText(/Aadhaar Card/i)).toBeInTheDocument();

    rerender(
      <TestWrapper defaultValues={{ identityType: 'INDIVIDUAL' }}>
        <OnboardingChecklist {...defaultProps} currentStep={3} market="US" />
      </TestWrapper>
    );

    expect(screen.getByText(/SSN or EIN/i)).toBeInTheDocument();
    expect(screen.queryByText(/PAN Card/i)).not.toBeInTheDocument();
  });

  it('handles division-by-zero safely when STEPS array is empty', () => {
    (global as any).__MOCK_CHECKLIST_STEPS__ = [];

    render(
      <TestWrapper>
        <OnboardingChecklist {...defaultProps} />
      </TestWrapper>
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });
});
