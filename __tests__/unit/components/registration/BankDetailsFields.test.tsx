import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { BankDetailsFields } from '@/features/seller/components/steps/BankDetailsFields';
import { useQuery } from '@tanstack/react-query';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

interface WrapperProps {
  children: React.ReactNode;
  defaultErrors?: any;
}

function FormWrapper({ children, defaultErrors = {} }: WrapperProps) {
  const methods = useForm({
    defaultValues: {
      bankAccountNumber: '',
      bankAccountNumberConfirm: '',
      bankIfsc: '',
    },
  });

  React.useEffect(() => {
    Object.keys(defaultErrors).forEach((key) => {
      methods.setError(key as any, defaultErrors[key]);
    });
  }, [defaultErrors, methods]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('BankDetailsFields Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
  });

  // Regression: this exact bank-fieldset UI previously lived in
  // FinanceStep.tsx, a fully-built component that was never imported by
  // the live onboarding wizard — sellers could complete registration with
  // no payout destination on file. It's now rendered inside StoreStep
  // instead of as a separate wizard step (see StoreStep.tsx for why: adding
  // a new step would have required touching 33 files that reference
  // hardcoded step counts/numbers).
  it('renders the bank account and IFSC fields', () => {
    render(
      <FormWrapper>
        <BankDetailsFields />
      </FormWrapper>
    );

    expect(screen.getByText('Payout Bank Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Account Number')).toBeInTheDocument();
    expect(screen.getByLabelText('IFSC Code')).toBeInTheDocument();
  });

  it('shows field-level validation errors', () => {
    const mockErrors = {
      bankAccountNumber: { type: 'required', message: 'Enter a valid bank account number (9-18 digits)' },
      bankIfsc: { type: 'pattern', message: 'Enter a valid 11-character IFSC code (e.g. SBIN0123456)' },
    };

    render(
      <FormWrapper defaultErrors={mockErrors}>
        <BankDetailsFields />
      </FormWrapper>
    );

    expect(screen.getByText('Enter a valid bank account number (9-18 digits)')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid 11-character IFSC code (e.g. SBIN0123456)')).toBeInTheDocument();
  });

  it('shows a loading indicator while the IFSC lookup is in flight', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(
      <FormWrapper>
        <BankDetailsFields />
      </FormWrapper>
    );

    expect(screen.getByText(/Verifying IFSC details.../i)).toBeInTheDocument();
  });

  it('shows the resolved bank and branch once the IFSC lookup succeeds', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { BANK: 'HDFC Bank', BRANCH: 'MG Road' },
      isLoading: false,
      isError: false,
    });

    render(
      <FormWrapper>
        <BankDetailsFields />
      </FormWrapper>
    );

    expect(screen.getByText('HDFC Bank — MG Road')).toBeInTheDocument();
  });

  it('toggles account number visibility', () => {
    render(
      <FormWrapper>
        <BankDetailsFields />
      </FormWrapper>
    );

    const accountInput = screen.getByLabelText('Account Number') as HTMLInputElement;
    expect(accountInput.type).toBe('password');

    fireEvent.click(screen.getByLabelText('Show account number'));
    expect(accountInput.type).toBe('text');
  });
});
