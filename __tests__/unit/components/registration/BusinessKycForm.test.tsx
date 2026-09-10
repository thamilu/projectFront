import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { BusinessKycForm } from '@/features/seller/components/steps/BusinessKycForm';
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

const mockUseKycVerification = useKycVerification as jest.Mock;

interface WrapperProps {
  children: React.ReactNode;
  defaultErrors?: any;
}

function FormWrapper({ children, defaultErrors = {} }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      businessName: '',
      businessPan: '',
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

describe('BusinessKycForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKycVerification.mockReturnValue({
      isBusinessPanVerified: false,
      isBusinessPanVerifying: false,
      isGstinVerified: false,
      isGstinVerifying: false,
    });
  });

  it('renders all form input fields correctly', () => {
    render(
      <FormWrapper>
        <BusinessKycForm />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Legal Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business PAN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/GSTIN \(Tax ID\)/i)).toBeInTheDocument();
  });

  it('renders error summary when errors are present', () => {
    const mockErrors = {
      businessName: { type: 'required', message: 'Name is required' },
      businessPan: { type: 'pattern', message: 'Invalid format' },
    };

    render(
      <FormWrapper defaultErrors={mockErrors}>
        <BusinessKycForm />
      </FormWrapper>
    );

    const errorSummary = screen.getByTestId('kyc-error-summary');
    expect(errorSummary).toBeInTheDocument();
    expect(screen.getByText(/Legal Business Name: Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Business PAN: Invalid format/i)).toBeInTheDocument();
  });

  it('displays verifying status when verification queries are pending', () => {
    mockUseKycVerification.mockReturnValue({
      isBusinessPanVerified: false,
      isBusinessPanVerifying: true,
      isGstinVerified: false,
      isGstinVerifying: true,
    });

    render(
      <FormWrapper>
        <BusinessKycForm />
      </FormWrapper>
    );

    expect(screen.getByTestId('businessPan-verifying-badge')).toBeInTheDocument();
    expect(screen.getByTestId('gstin-verifying-badge')).toBeInTheDocument();
  });

  it('displays verified status badges when verification queries succeed', () => {
    mockUseKycVerification.mockReturnValue({
      isBusinessPanVerified: true,
      isBusinessPanVerifying: false,
      isGstinVerified: true,
      isGstinVerifying: false,
    });

    render(
      <FormWrapper>
        <BusinessKycForm />
      </FormWrapper>
    );

    expect(screen.getByTestId('businessPan-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('gstin-verified-badge')).toBeInTheDocument();
  });
});
