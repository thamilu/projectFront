import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { IndividualKycForm } from '@/features/seller/components/steps/IndividualKycForm';
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

describe('IndividualKycForm Component', () => {
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
        <IndividualKycForm />
      </FormWrapper>
    );

    expect(screen.getByLabelText(/PAN Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aadhaar Number/i)).toBeInTheDocument();
    expect(screen.getByText('Individual KYC Identity Verification')).toBeInTheDocument();
  });

  it('masks PAN and Aadhaar values when blurred and unmasks on focus', () => {
    render(
      <FormWrapper>
        <IndividualKycForm />
      </FormWrapper>
    );

    // Regex match, not exact string: the label's accessible name includes a
    // "(required)" suffix from the required-field indicator (see aadhar below).
    const panInput = screen.getByLabelText(/PAN Number/i);
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
    // Mock verified PAN and verifying Aadhaar
    mockUseKycVerification.mockReturnValue({
      isPanNumberVerified: true,
      isPanNumberVerifying: false,
      isAadharVerified: false,
      isAadharVerifying: true,
    });

    render(
      <FormWrapper>
        <IndividualKycForm />
      </FormWrapper>
    );

    // Live status region should prioritize active verifying Aadhaar message over verified PAN
    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toHaveTextContent('Verifying Aadhaar Number, please wait...');
    expect(liveRegion).not.toHaveTextContent('PAN Number verified successfully.');
  });

  it('renders form-level error alerts when validation fails without redundant descriptors', () => {
    const mockErrors = {
      panNumber: { type: 'pattern', message: 'Invalid format description' },
    };

    render(
      <FormWrapper defaultErrors={mockErrors}>
        <IndividualKycForm />
      </FormWrapper>
    );

    const errorSummary = screen.getByTestId('kyc-error-summary');
    expect(errorSummary).toBeInTheDocument();
    expect(errorSummary).toHaveAttribute('role', 'alert');
    expect(errorSummary).not.toHaveAttribute('aria-live'); // Redundancy stripped
    expect(screen.getByText(/PAN Number: Invalid format description/i)).toBeInTheDocument();
  });
});
