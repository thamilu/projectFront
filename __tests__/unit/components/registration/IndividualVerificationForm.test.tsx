import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { IndividualVerificationForm } from '@/features/seller/components/steps/IndividualVerificationForm';
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
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'sellerOnboarding.verification.title': 'Verification Details',
        'sellerOnboarding.verification.sections.tax': 'Tax Information',
        'sellerOnboarding.verification.sections.identity': 'Identity Details',
        'sellerOnboarding.verification.fields.panIndividual': 'Individual PAN',
        'sellerOnboarding.verification.fields.aadhar': 'Aadhaar Number',
        'sellerOnboarding.verification.helpers.pan': 'Enter your 10-character PAN as it appears on your card (e.g. ABCDE1234F)',
        'sellerOnboarding.verification.helpers.aadhar': 'Enter your 12-digit Aadhaar number',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

const mockUseKycVerification = useKycVerification as jest.Mock;

interface WrapperProps {
  children: React.ReactNode;
  defaultValues?: any;
  defaultErrors?: any;
}

function FormWrapper({ children, defaultValues = {}, defaultErrors = {} }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      panNumber: '',
      aadhar: '',
      ...defaultValues,
    },
  });

  // Inject errors to formState manually using useEffect
  React.useEffect(() => {
    Object.keys(defaultErrors).forEach((key) => {
      methods.setError(key as any, defaultErrors[key]);
    });
  }, [defaultErrors, methods]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('IndividualVerificationForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: false,
      isPanNumberVerifying: false,
      isAadharVerified: false,
      isAadharVerifying: false,
    });
  });

  it('renders inputs, label titles, helper text, and legend group context correctly', () => {
    render(
      <FormWrapper>
        <IndividualVerificationForm />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/Individual PAN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aadhaar Number/i)).toBeInTheDocument();
    expect(screen.getByText('Verification Details')).toBeInTheDocument();
    expect(screen.getByText('Enter your 10-character PAN as it appears on your card (e.g. ABCDE1234F)')).toBeInTheDocument();
    expect(screen.getByText('Enter your 12-digit Aadhaar number')).toBeInTheDocument();
  });

  it('masks PAN and Aadhaar values when blurred and unmasks on focus', () => {
    render(
      <FormWrapper>
        <IndividualVerificationForm />
      </FormWrapper>
    );

    const panInput = screen.getByLabelText(/Individual PAN/i);
    const aadharInput = screen.getByLabelText(/Aadhaar Number/i);

    // Focus and type PAN
    act(() => {
      panInput.focus();
    });
    act(() => {
      fireEvent.change(panInput, { target: { value: 'abcde1234f' } });
    });
    expect(panInput).toHaveValue('ABCDE1234F'); // Capitalized on typing

    // Blur PAN
    act(() => {
      panInput.blur();
    });
    expect(panInput).toHaveValue('ABCDE****F'); // Masked

    // Focus and type Aadhaar
    act(() => {
      aadharInput.focus();
    });
    act(() => {
      fireEvent.change(aadharInput, { target: { value: '123456789012' } });
    });
    expect(aadharInput).toHaveValue('1234 5678 9012'); // Formatted

    // Blur Aadhaar
    act(() => {
      aadharInput.blur();
    });
    expect(aadharInput).toHaveValue('XXXX XXXX 9012'); // Masked

    // Refocus Aadhaar should unmask
    act(() => {
      aadharInput.focus();
    });
    expect(aadharInput).toHaveValue('1234 5678 9012');
  });

  it('updates live region status correctly with de-concatenated messages', () => {
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: true,
      isPanNumberVerifying: false,
      isAadharVerified: false,
      isAadharVerifying: true,
    });

    render(
      <FormWrapper>
        <IndividualVerificationForm />
      </FormWrapper>
    );

    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toHaveTextContent('Verifying Aadhaar, please wait...');
    expect(liveRegion).not.toHaveTextContent('PAN Number verified successfully.');
  });

  it('renders form-level error alerts when validation fails with focus anchors', () => {
    const mockErrors = {
      panNumber: { type: 'pattern', message: 'Invalid format' },
    };

    render(
      <FormWrapper defaultErrors={mockErrors}>
        <IndividualVerificationForm />
      </FormWrapper>
    );

    const errorSummary = screen.getByTestId('verification-error-summary');
    expect(errorSummary).toBeInTheDocument();
    expect(errorSummary).toHaveAttribute('role', 'alert');
    expect(errorSummary).not.toHaveAttribute('aria-live'); // No redundant live settings
    expect(screen.getByText(/Individual PAN: Invalid format/i)).toBeInTheDocument();
  });

  it('displays verifying and verified badges when hook values update', () => {
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: true,
      isPanNumberVerifying: false,
      isAadharVerified: false,
      isAadharVerifying: true,
    });

    render(
      <FormWrapper>
        <IndividualVerificationForm />
      </FormWrapper>
    );

    expect(screen.getByTestId('panNumber-verified-badge')).toBeInTheDocument();
    expect(screen.getByTestId('aadhar-verifying-badge')).toBeInTheDocument();
  });

  it('intercepts paste on Aadhaar and clears clipboard for security', async () => {
    const mockWriteText = jest.fn().mockImplementation(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });

    render(
      <FormWrapper>
        <IndividualVerificationForm />
      </FormWrapper>
    );

    const aadharInput = screen.getByLabelText(/Aadhaar Number/i);

    const clipboardData = {
      getData: jest.fn().mockReturnValue('9876 5432 1098'),
    };

    act(() => {
      aadharInput.focus();
    });

    await act(async () => {
      fireEvent.paste(aadharInput, { clipboardData });
    });

    expect(aadharInput).toHaveValue('9876 5432 1098');
    expect(mockWriteText).toHaveBeenCalledWith('');
  });
});
