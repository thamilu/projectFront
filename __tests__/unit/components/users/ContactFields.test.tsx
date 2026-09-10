import { render, screen } from '@testing-library/react';
import { ContactFields } from '@/features/users/components/tabs/components/ContactFields';
import { FormProvider, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Helper component to wrap with FormProvider
function FormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: {
      email: 'test@example.com',
      phone: '+91 98765 43210',
    },
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('ContactFields Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton when session status is loading', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(
      <FormWrapper>
        <ContactFields />
      </FormWrapper>
    );

    expect(screen.getByTestId('contact-fields-skeleton')).toBeInTheDocument();
  });

  it('renders fields correctly with initial values', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'user@example.com' } },
      status: 'authenticated',
    });

    render(
      <FormWrapper>
        <ContactFields />
      </FormWrapper>
    );

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    expect(emailInput).toBeInTheDocument();
    expect(emailInput.value).toBe('user@example.com');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveAttribute('readonly');

    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).not.toBeDisabled();
  });
});
