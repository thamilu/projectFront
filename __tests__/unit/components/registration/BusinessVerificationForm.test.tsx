import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { BusinessVerificationForm } from '@/features/seller/components/steps/BusinessVerificationForm';
import { useKycVerification } from '@/features/seller/hooks/use-kyc-verification';

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

// Mock custom verification hook
jest.mock('@/features/seller/hooks/use-kyc-verification');

// Mock i18n translation hook
jest.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.verification.title': 'Verification Details',
        'sellerOnboarding.verification.sections.tax': 'Tax Information',
        'sellerOnboarding.verification.sections.identity': 'Identity & GST',
        'sellerOnboarding.verification.fields.panRepresentative': 'Representative PAN',
        'sellerOnboarding.verification.fields.businessPan': 'Business PAN',
        'sellerOnboarding.verification.fields.aadhar': 'Aadhaar Number',
        'sellerOnboarding.verification.fields.gstin': 'GSTIN',
      };
      return translations[key] || key;
    },
  }),
}));

const mockUseKycVerification = useKycVerification as jest.Mock;

interface WrapperProps {
  children: React.ReactNode;
  defaultErrors?: any;
}

function FormWrapper({ children, defaultErrors = {} }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      panNumber: '',
      businessPan: '',
      aadhar: '',
      gstin: '',
    },
  });

  // Inject errors to formState manually using useEffect to avoid render-phase state updates which cause loops
  React.useEffect(() => {
    Object.keys(defaultErrors).forEach((key) => {
      methods.setError(key as any, defaultErrors[key]);
    });
  }, [defaultErrors, methods]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('BusinessVerificationForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: false,
      isPanNumberVerifying: false,
      isBusinessPanVerified: false,
      isBusinessPanVerifying: false,
      isAadharVerified: false,
      isAadharVerifying: false,
      isGstinVerified: false,
      isGstinVerifying: false,
    });
  });

  it('renders section headers and legend correctly', () => {
    render(
      <FormWrapper>
        <BusinessVerificationForm />
      </FormWrapper>
    );

    expect(screen.getByText('Tax Information')).toBeInTheDocument();
    expect(screen.getByText('Identity & GST')).toBeInTheDocument();
  });

  it('renders all four validation input components', () => {
    render(
      <FormWrapper>
        <BusinessVerificationForm />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Representative PAN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business PAN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aadhaar Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/GSTIN/i)).toBeInTheDocument();
  });

  it('renders error summary when validation errors are present', () => {
    const mockErrors = {
      panNumber: { type: 'required', message: 'PAN is required' },
      gstin: { type: 'pattern', message: 'Invalid format' },
    };

    render(
      <FormWrapper defaultErrors={mockErrors}>
        <BusinessVerificationForm />
      </FormWrapper>
    );

    const errorSummary = screen.getByTestId('verification-error-summary');
    expect(errorSummary).toBeInTheDocument();
    expect(screen.getByText(/Representative PAN: PAN is required/i)).toBeInTheDocument();
    expect(screen.getByText(/GSTIN: Invalid format/i)).toBeInTheDocument();
  });

  it('displays verifying indicator status badges when queries are pending', () => {
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: false,
      isPanNumberVerifying: true,
      isBusinessPanVerified: false,
      isBusinessPanVerifying: true,
      isAadharVerified: false,
      isAadharVerifying: true,
      isGstinVerified: false,
      isGstinVerifying: true,
    });

    render(
      <FormWrapper>
        <BusinessVerificationForm />
      </FormWrapper>
    );

    expect(screen.getByTestId('panNumber-verifying-badge')).toBeInTheDocument();
    expect(screen.getByTestId('businessPan-verifying-badge')).toBeInTheDocument();
    expect(screen.getByTestId('aadhar-verifying-badge')).toBeInTheDocument();
    expect(screen.getByTestId('gstin-verifying-badge')).toBeInTheDocument();
  });

  it('displays verified badges when verification queries succeed', () => {
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: true,
      isPanNumberVerifying: false,
      isBusinessPanVerified: true,
      isBusinessPanVerifying: false,
      isAadharVerified: true,
      isAadharVerifying: false,
      isGstinVerified: true,
      isGstinVerifying: false,
    });

    render(
      <FormWrapper>
        <BusinessVerificationForm />
      </FormWrapper>
    );

    expect(screen.getByTestId('panNumber-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('businessPan-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('aadhar-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('gstin-verified-badge')).toBeInTheDocument();
  });
});
